import { repetitionBookPackFixture } from '../fixtures/bookPack.ts';
import { fixturePuzzle } from '../fixtures/puzzles.ts';
import { playerMoves } from '../data/solutions.ts';
import { test, expect } from '../fixtures/trainer.ts';

for (const side of ['white', 'black'] as const) {
  test(`completes an imported ${side} repetition draw with retained history`, async ({
    practice: trainer,
  }) => {
    const pack = repetitionBookPackFixture(side);
    await trainer.importStudyPack(pack);
    await expect(trainer.notice()).toBeVisible();
    await expect(trainer.notice()).toContainText('Imported 1 verified book exercises');
    const moves = playerMoves(fixturePuzzle(pack));
    for (const [index, uci] of moves.entries()) {
      await trainer.board.playMove(uci);
      await expect(trainer.feedback()).toContainText(
        index < moves.length - 1 ? 'Find the continuation' : 'Correct! Draw.',
      );
    }
    await expect(trainer.stats()).toContainText('Solved first try');
    await expect(trainer.progress()).toHaveAttribute('value', '1');
    await expect(trainer.historyMove(0)).toHaveText(side === 'white' ? '1. Nf3' : '1... Nf6');
  });
}
