import { test, expect } from '@playwright/test';
import { resetDb, countSeniors } from './helpers/db';

test.beforeEach(async () => {
  await resetDb();
});

test('이름 비움 → 이름 필드 위 빨간 안내 박스 노출 / seniors 테이블 레코드 미생성', async ({ page }) => {
  // 제출 전 seniors 행 수 확인 (resetDb 후 0이어야 함)
  const beforeCount = await countSeniors();

  await page.goto('/register');

  // 이름: 비움 (기본값 유지)

  // 지역 선택
  await page.getByRole('combobox').filter({ hasText: '지역을 선택하세요' }).click();
  await page.getByRole('option', { name: '서울', exact: true }).click();

  // 희망 직종 선택
  await page.getByRole('combobox').filter({ hasText: '직종을 선택하세요' }).click();
  await page.getByRole('option', { name: '경비', exact: true }).click();

  // 경력 입력
  await page.fill('#career_years', '3');

  // 제출
  await page.getByRole('button', { name: '등록하기' }).click();

  // 이름 필드 위 빨간 안내 박스 노출 확인
  await expect(page.getByText('이름을 입력해 주세요.')).toBeVisible({ timeout: 5_000 });

  // 성공 메시지는 없어야 함
  await expect(page.getByText('등록이 완료되었습니다')).not.toBeVisible();

  // DB 에 새 레코드가 들어가지 않았는지 확인
  const afterCount = await countSeniors();
  expect(afterCount).toBe(beforeCount);
});
