import { bookPuzzle } from '../data/book.ts';
import { bookPackFixture } from '../fixtures/bookPack.ts';
import { expect, test } from '../fixtures/storage.ts';
import { expectBoardPosition } from '../support/boardAssertions.ts';

test.describe('corrupt saved progress', () => {
  test.use({ storageScenario: 'corrupt-progress' });

  test('recovers to a usable collection and persists fresh progress across reload', async ({
    trainer,
  }) => {
    await trainer.open();
    await expect(trainer.collection()).toHaveValue('ivashchenko-1a');
    await expect(trainer.exercise()).toHaveValue('1');
    await expect(trainer.progress()).toHaveAttribute('value', '0');
    await expectBoardPosition(trainer.board, bookPuzzle(1).fen);

    await trainer.selectCollection('lichess-practice');
    await trainer.selectExercise(1);
    await trainer.board.move('a2', 'e6');
    await trainer.board.move('f7', 'f8');
    await expect(trainer.feedback()).toContainText('Correct! Checkmate.');
    await expect(trainer.stats()).toContainText('Solved first try');
    await trainer.nextExercise();
    await trainer.reload();

    await expect(trainer.collection()).toHaveValue('lichess-practice');
    await expect(trainer.exercise()).toHaveValue('2');
    await expect(trainer.board.square('e8')).toHaveAttribute('aria-label', 'e8 Black rook');
    await expect(trainer.progress()).toHaveAttribute('value', '1');
    await trainer.previousExercise();
    await expect(trainer.stats()).toContainText('Solved first try');
  });
});

test.describe('storage read denied', () => {
  test.use({ storageScenario: 'read-denied' });

  test('reports the read failure while keeping solving and session progress usable', async ({
    practice: trainer,
  }) => {
    await expect(trainer.notice()).toContainText(
      'Browser storage is unavailable. Progress will last for this session.',
    );
    await expect(trainer.board.square('a2')).toHaveAttribute('aria-label', 'a2 White bishop');
    await trainer.board.move('a2', 'e6');
    await trainer.board.move('f7', 'f8');
    await expect(trainer.feedback()).toContainText('Correct! Checkmate.');
    await expect(trainer.progress()).toHaveAttribute('value', '1');
    await expect(trainer.stats()).toContainText('Solved first try');
    await trainer.nextExercise();
    await expect(trainer.exercise()).toHaveValue('2');
    await expect(trainer.board.square('e8')).toHaveAttribute('aria-label', 'e8 Black rook');
    await trainer.previousExercise();
    await expect(trainer.progress()).toHaveAttribute('value', '1');
    await expect(trainer.stats()).toContainText('Solved first try');
  });
});

test.describe('storage write denied', () => {
  test.use({ storageScenario: 'write-denied' });

  test('reports failed persistence while retaining progress and imports in the session', async ({
    practice: trainer,
  }) => {
    await expect(trainer.notice()).toContainText(
      'Progress could not be saved. You can continue in this session.',
    );
    await trainer.board.move('a2', 'e6');
    await trainer.board.move('f7', 'f8');
    await expect(trainer.feedback()).toContainText('Correct! Checkmate.');
    await expect(trainer.progress()).toHaveAttribute('value', '1');
    await trainer.nextExercise();
    await expect(trainer.exercise()).toHaveValue('2');
    await trainer.previousExercise();
    await expect(trainer.stats()).toContainText('Solved first try');

    await trainer.importStudyPack(bookPackFixture());
    await expect(trainer.notice()).toContainText(
      'Pack imported for this session. Browser storage could not retain it.',
    );
    await expect(trainer.collection()).toHaveValue('ivashchenko-1a');
    await expect(trainer.board.square('d8')).toHaveAttribute('aria-label', 'd8 Black queen');
    await trainer.board.move('d8', 'h4');
    await expect(trainer.feedback()).toContainText('Correct! Checkmate.');
    await expect(trainer.progress()).toHaveAttribute('value', '1');
    await trainer.selectCollection('lichess-practice');
    await expect(trainer.progress()).toHaveAttribute('value', '1');
    await expect(trainer.stats()).toContainText('Solved first try');
    await trainer.selectCollection('ivashchenko-1a');
    await expect(trainer.progress()).toHaveAttribute('value', '1');
    await expect(trainer.stats()).toContainText('Solved first try');
  });
});
