import bookData from '../../src/data/book.json' with { type: 'json' };
import { test, expect, square, movePiece, expectBoardPosition } from '../support/trainer.ts';

test('renders every original book position and preserves the last exercise', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('./');
  await expect(page.getByLabel('Collection', { exact: true })).toHaveValue('ivashchenko-1a');
  await expect(page.getByLabel('All 719 book exercises').locator('option:enabled')).toHaveCount(
    719,
  );
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'max',
    '718',
  );
  const exercise = page.getByLabel('Exercise', { exact: true });
  for (const puzzle of bookData.puzzles) {
    await exercise.selectOption(String(puzzle.id));
    await expect(page.locator('.exercise-number')).toHaveText(
      `EXERCISE ${String(puzzle.id).padStart(3, '0')}`,
    );
    await expectBoardPosition(page, puzzle.fen);
  }
  await expect(page.getByRole('button', { name: 'Next exercise', exact: true })).toBeDisabled();
  await page.reload();
  await expect(exercise).toHaveValue('719');
  await expectBoardPosition(page, bookData.puzzles[718]!.fen);
});

test('completes mates, material tactics and draws including long and special-move lines', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(90000);
  await page.goto('./');
  let completed = 0;
  for (const id of [1, 148, 151, 241, 258, 271, 351, 419, 605, 631, 702, 719]) {
    const puzzle = bookData.puzzles.find((item) => item.id === id)!;
    await page.getByLabel('Exercise', { exact: true }).selectOption(String(id));
    const line = puzzle.solutions[0]!.uci;
    for (let ply = 0; ply < line.length; ply += 2) {
      const uci = line[ply]!;
      await movePiece(page, uci.slice(0, 2), uci.slice(2, 4), isMobile);
      if (uci.length === 5) {
        const names: Record<string, string> = { q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' };
        await page
          .getByRole('dialog', { name: 'Choose your promotion' })
          .getByRole('button', { name: names[uci[4]!]!, exact: true })
          .click();
      }
    }
    completed++;
    await expect(page.locator('.exercise-stats')).toContainText('Solved first try');
    await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
      'value',
      String(completed),
    );
    await expect(page.locator('.feedback')).toContainText(
      puzzle.objective === 'draw' ? 'Correct! Draw.' : 'Correct!',
    );
  }
  await page.reload();
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('719');
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '12',
  );
});

test('shows the original source error as unscored playback with the legal escape', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByLabel('Exercise', { exact: true }).selectOption('389');
  await expect(page.getByRole('heading', { name: 'Study the source error' })).toBeVisible();
  await expect(page.getByRole('note', { name: 'Source note' })).toContainText(
    'printed attack fails to mate',
  );
  await expect(page.getByRole('button', { name: 'Hint', exact: true })).toBeDisabled();
  const next = page.getByRole('button', { name: /Play next move/ });
  for (let ply = 0; ply < 4; ply++) await next.click();
  await expect(next).toBeDisabled();
  await expect(square(page, 'h3')).toHaveAttribute('aria-label', 'h3 White king');
  await expect(page.locator('.exercise-stats')).toContainText('Source note · not scored');
  await expect(
    page.getByLabel('Exercise', { exact: true }).locator('option[value="389"]'),
  ).toHaveText('#389 · source note');
  await expect(page.getByLabel('Move history').locator('span').nth(0)).toHaveText('1... Rh2+');
  await expect(page.getByLabel('Move history').locator('span').nth(1)).toHaveText('2. Nxh2');
  await expect(page.getByLabel('Move history').locator('span').nth(3)).toHaveText('3. Kh3');
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '0',
  );
  await page.getByRole('button', { name: 'Retry exercise', exact: true }).click();
  await expect(square(page, 'g2')).toHaveAttribute('aria-label', 'g2 White king');
  await expect(page.getByRole('button', { name: 'Hint', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Next exercise', exact: true }).click();
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('390');
  await expect(page.getByRole('button', { name: 'Hint', exact: true })).toBeEnabled();
});
