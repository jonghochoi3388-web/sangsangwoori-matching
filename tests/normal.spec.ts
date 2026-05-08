import { test, expect } from '@playwright/test';
import { resetDb, insertJob } from './helpers/db';

test.beforeEach(async () => {
  await resetDb();
  // 서울/경비/요구경력 3년 공고 1건 세팅
  await insertJob({
    title: '서울 아파트 경비원 모집',
    region: '서울',
    job_type: '경비',
    required_career: 3,
  });
});

test('시니어 등록 → 완료 메시지 노출 → 추천 목록에 6점 금색 배지 카드 상단 표시', async ({ page }) => {
  await page.goto('/register');

  // 이름 입력
  await page.fill('#name', '테스트시니어');

  // 지역 선택 (서울)
  await page.getByRole('combobox').filter({ hasText: '지역을 선택하세요' }).click();
  await page.getByRole('option', { name: '서울', exact: true }).click();

  // 희망 직종 선택 (경비)
  await page.getByRole('combobox').filter({ hasText: '직종을 선택하세요' }).click();
  await page.getByRole('option', { name: '경비', exact: true }).click();

  // 경력 입력 (5년 → 요구경력 3년 이상 충족)
  await page.fill('#career_years', '5');

  // 제출
  await page.getByRole('button', { name: '등록하기' }).click();

  // ✅ 초록 완료 박스 노출 확인
  await expect(page.getByText('등록이 완료되었습니다')).toBeVisible({ timeout: 15_000 });

  // 추천 일자리 페이지로 이동
  await page.getByRole('link', { name: /내 추천 일자리 보기/ }).click();

  // ⭐ 6점 금색(amber) 배지 카드가 페이지 상단에 표시되는지 확인
  // 서울+경비+경력충족 → 3+2+1 = 6점
  const goldBadge = page.getByText('⭐ 6점').first();
  await expect(goldBadge).toBeVisible({ timeout: 15_000 });
});
