import { test, expect } from '@playwright/test';
import { resetDb, insertJob } from './helpers/db';

test.beforeEach(async () => {
  await resetDb();
  // 조건이 절대 맞지 않는 공고 1건:
  //   지역=기타, 직종=기타, required_career=99
  // 시니어(서울/경비/3)와의 매칭 점수 계산:
  //   region 불일치(0) + job_type 불일치(0) + career(3 < 99, 0) = 0점
  // → recommendations 페이지의 gt("score", 0) 필터에서 걸러져 "매칭 없음" 메시지 노출
  await insertJob({
    title: '기타 지역 기타 직종 공고',
    region: '기타',
    job_type: '기타',
    required_career: 99,
  });
});

test('매칭 안 되는 공고만 있을 때 → "현재 매칭되는 일자리가 없습니다" 안내 박스 노출', async ({ page }) => {
  await page.goto('/register');

  // 서울 / 경비 / 경력 3년 시니어 등록
  await page.fill('#name', '노매치시니어');

  await page.getByRole('combobox').filter({ hasText: '지역을 선택하세요' }).click();
  await page.getByRole('option', { name: '서울', exact: true }).click();

  await page.getByRole('combobox').filter({ hasText: '직종을 선택하세요' }).click();
  await page.getByRole('option', { name: '경비', exact: true }).click();

  await page.fill('#career_years', '3');

  await page.getByRole('button', { name: '등록하기' }).click();

  // 등록 완료 확인
  await expect(page.getByText('등록이 완료되었습니다')).toBeVisible({ timeout: 15_000 });

  // 추천 페이지로 이동
  await page.getByRole('link', { name: /내 추천 일자리 보기/ }).click();

  // "현재 매칭되는 일자리가 없습니다" 안내 박스 확인
  await expect(
    page.getByText('현재 매칭되는 일자리가 없습니다'),
  ).toBeVisible({ timeout: 15_000 });
});
