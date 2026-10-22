import { expect, test } from '@playwright/test';

test('serves the trainer at its project path without browser errors', async ({ page, baseURL }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(baseURL!);
  await expect(page).toHaveTitle('Combinations — Chess Trainer');
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(browserErrors).toEqual([]);
});
