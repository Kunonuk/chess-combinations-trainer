import { expect, test } from '../support/trainer.ts';

test('serves the trainer at its project path without browser errors', async ({ page, baseURL }) => {
  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(baseURL!);
  await expect(page).toHaveTitle('Combinations — Chess Trainer');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
