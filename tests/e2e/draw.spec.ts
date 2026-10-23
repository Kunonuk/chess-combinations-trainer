import { bookPackFixture } from '../fixtures/bookPack.ts';
import { repetitionFixture } from '../fixtures/puzzles.ts';
import { test, expect, openPractice, importStudyJSON, movePiece } from '../support/trainer.ts';

for (const side of ['white', 'black'] as const) {
  test(`completes an imported ${side} repetition draw with retained history`, async ({
    page,
    isMobile,
  }) => {
    const pack = bookPackFixture();
    const puzzle = repetitionFixture(side);
    puzzle.source = { ...pack.puzzles[0]!.source, exercise: 1 };
    pack.puzzles = [puzzle];
    await openPractice(page);
    await importStudyJSON(page, JSON.stringify(pack));
    await expect(page.getByText(/Imported 1 verified book exercises/)).toBeVisible();
    const moves = puzzle.solutions[0]!.uci;
    for (let ply = 0; ply < moves.length; ply += 2) {
      const uci = moves[ply]!;
      await movePiece(page, uci.slice(0, 2), uci.slice(2, 4), isMobile);
      await expect(page.locator('.feedback')).toContainText(
        ply < 6 ? 'Find the continuation' : 'Correct! Draw.',
      );
    }
    await expect(page.locator('.exercise-stats')).toContainText('Solved first try');
    await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
      'value',
      '1',
    );
    await expect(page.getByLabel('Move history').locator('span').first()).toHaveText(
      side === 'white' ? '1. Nf3' : '1... Nf6',
    );
  });
}
