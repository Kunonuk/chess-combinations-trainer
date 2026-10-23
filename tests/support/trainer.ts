import { expect, test as base, type Page } from '@playwright/test';
import { Chess, type Square } from 'chess.js';

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

export async function expectBoardPosition(page: Page, fen: string) {
  const chess = new Chess(fen);
  const names = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  const expected = Array.from({ length: 64 }, (_, index) => {
    const square = (String.fromCharCode(97 + (index % 8)) +
      String(8 - Math.floor(index / 8))) as Square;
    const piece = chess.get(square);
    return piece
      ? `${square} ${piece.color === 'w' ? 'White' : 'Black'} ${names[piece.type]}`
      : `${square} empty`;
  });
  await expect.poll(() => boardPosition(page)).toEqual(expected);
}
