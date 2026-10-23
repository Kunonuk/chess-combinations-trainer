import { expect, test as base, type Page } from '@playwright/test';

export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await use(errors);
      expect(errors, 'No uncaught browser or console errors').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export const square = (page: Page, name: string) => page.getByTestId('square-' + name);

export async function openPractice(page: Page) {
  await page.goto('./');
  await page.getByLabel('Collection', { exact: true }).selectOption('lichess-practice');
  await page.getByLabel('Exercise', { exact: true }).selectOption('1');
  await expect(square(page, 'a2')).toHaveAttribute('aria-label', 'a2 White bishop');
}

export async function movePiece(page: Page, from: string, to: string, touch: boolean) {
  if (touch) {
    await square(page, from).tap();
    await square(page, to).tap();
  } else {
    await square(page, from).click();
    await square(page, to).click();
  }
}

export async function boardPosition(page: Page) {
  return page
    .getByRole('gridcell')
    .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('aria-label')));
}

export async function importStudyJSON(page: Page, raw: string) {
  await page.getByLabel('Import verified private pack', { exact: true }).setInputFiles({
    name: 'test-pack.json',
    mimeType: 'application/json',
    buffer: Buffer.from(raw),
  });
}
