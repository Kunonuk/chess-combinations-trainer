import { test, expect, openPractice, square } from '../support/trainer.ts';

test('applies appearance changes and retains both settings across refreshes', async ({ page }) => {
  await openPractice(page);
  const app = page.locator('.app');
  const boardTheme = page.getByRole('combobox', { name: 'Board theme' });
  const originalBackground = await app.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  const originalSquare = await square(page, 'a1').evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await boardTheme.selectOption('walnut');
  await page.getByRole('button', { name: 'Use dark appearance' }).click();
  await expect(app).toHaveClass(/dark/);
  await expect(app).not.toHaveCSS('background-color', originalBackground);
  await expect(square(page, 'a1')).not.toHaveCSS('background-color', originalSquare);
  await page.reload();
  await expect(boardTheme).toHaveValue('walnut');
  await expect(page.getByRole('button', { name: 'Use light appearance' })).toBeVisible();
  await expect(app).toHaveClass(/dark/);
  await expect(app).not.toHaveCSS('background-color', originalBackground);
  await expect(square(page, 'a1')).not.toHaveCSS('background-color', originalSquare);

  await boardTheme.selectOption('forest');
  await expect(page.getByRole('button', { name: 'Use light appearance' })).toBeVisible();
  await page.getByRole('button', { name: 'Use light appearance' }).click();
  await page.reload();
  await expect(boardTheme).toHaveValue('forest');
  await expect(page.getByRole('button', { name: 'Use dark appearance' })).toBeVisible();
  await expect(app).not.toHaveClass(/dark/);
  await expect(app).toHaveCSS('background-color', originalBackground);
  await expect(square(page, 'a1')).toHaveCSS('background-color', originalSquare);
});

test('resetting study progress preserves appearance after refresh', async ({ page }) => {
  await openPractice(page);
  await page.getByRole('combobox', { name: 'Board theme' }).selectOption('walnut');
  await page.getByRole('button', { name: 'Use dark appearance' }).click();
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(page.locator('.hint-message')).toBeVisible();
  await page.getByRole('button', { name: 'Reset study progress', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset progress', exact: true })
    .click();
  await expect(page.locator('.hint-message')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Board theme' })).toHaveValue('walnut');
  await expect(page.getByRole('button', { name: 'Use light appearance' })).toBeVisible();
  await expect(page.locator('.app')).toHaveClass(/dark/);
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '0',
  );
});
