import { bookPuzzle } from '../data/book.ts';
import { bookPackFixture } from '../fixtures/bookPack.ts';
import { expect, test } from '../fixtures/trainer.ts';
import { expectBoardPosition } from '../support/boardAssertions.ts';

test('imports numbered gaps and upgrades an older partial cache to the complete edition', async ({
  practice: trainer,
}) => {
  await trainer.importStudyPack(bookPackFixture());
  await expect(trainer.notice()).toBeVisible();
  await expect(trainer.notice()).toContainText('Imported 2 verified book exercises');
  await expect(trainer.collection()).toHaveValue('ivashchenko-1a');
  await expect(trainer.board.square('d8')).toHaveAttribute('aria-label', 'd8 Black queen');
  const exercises = trainer.exercise();
  await expect(trainer.exerciseOption(2)).toBeDisabled();
  await trainer.nextExercise();
  await expect(exercises).toHaveValue('3');
  await expect(trainer.board.square('f7')).toHaveAttribute('aria-label', 'f7 White pawn');
  await expect(trainer.nextExerciseButton()).toBeDisabled();
  await trainer.reload();
  await expect(trainer.collection()).toHaveValue('ivashchenko-1a');
  await expect(exercises).toHaveValue('3');
  await expect(trainer.availableBookExercises()).toHaveCount(719);
  await expectBoardPosition(trainer.board, bookPuzzle(3).fen);
  // Rejected replacement must also leave the valid cached pack intact.
  const wrongEdition = bookPackFixture();
  wrongEdition.collection.sourceHash = '0'.repeat(64);
  await trainer.importStudyPack(wrongEdition);
  await expect(trainer.notice()).toBeVisible();
  await expect(trainer.notice()).toContainText('Pack was not imported:');
  await expect(exercises).toHaveValue('3');
  await trainer.reload();
  await expect(trainer.collection()).toHaveValue('ivashchenko-1a');
  await expectBoardPosition(trainer.board, bookPuzzle(3).fen);
});

test('malformed JSON leaves the current practice collection usable', async ({
  practice: trainer,
}) => {
  await trainer.importStudyJSON('{');
  await expect(trainer.notice()).toBeVisible();
  await expect(trainer.notice()).toContainText('Pack was not imported:');
  await expect(trainer.collection()).toHaveValue('lichess-practice');
  await expect(trainer.board.square('a2')).toHaveAttribute('aria-label', 'a2 White bishop');
  await trainer.nextExercise();
  await expect(trainer.exercise()).toHaveValue('2');
  await expect(trainer.board.square('e8')).toHaveAttribute('aria-label', 'e8 Black rook');
});

test('an oversized upload preserves the current collection, location and solved progress', async ({
  practice: trainer,
}) => {
  await trainer.board.move('a2', 'e6');
  await trainer.board.move('f7', 'f8');
  await expect(trainer.feedback()).toContainText('Correct! Checkmate.');
  await trainer.nextExercise();
  const position = await trainer.board.position();

  // Valid JSON over 5 MiB must hit the upload-size boundary before replacing the library.
  const oversized = JSON.stringify(bookPackFixture()) + ' '.repeat(5 * 1024 * 1024 + 1);
  await trainer.importStudyJSON(oversized);
  await expect(trainer.notice()).toContainText('Choose a JSON pack smaller than 5 MB.');
  await expect(trainer.collection()).toHaveValue('lichess-practice');
  await expect(trainer.exercise()).toHaveValue('2');
  await expect(trainer.progress()).toHaveAttribute('value', '1');
  await expect.poll(() => trainer.board.position()).toEqual(position);

  await trainer.reload();
  await expect(trainer.collection()).toHaveValue('lichess-practice');
  await expect(trainer.exercise()).toHaveValue('2');
  await expect(trainer.progress()).toHaveAttribute('value', '1');
  await expect.poll(() => trainer.board.position()).toEqual(position);
  await trainer.previousExercise();
  await expect(trainer.stats()).toContainText('Solved first try');
});

test('a rejected replacement retains imported exercises and their solved progress', async ({
  practice: trainer,
}) => {
  await trainer.importStudyPack(bookPackFixture());
  await expect(trainer.notice()).toContainText('Imported 2 verified book exercises');
  await trainer.board.move('d8', 'h4');
  await expect(trainer.feedback()).toContainText('Correct! Checkmate.');
  await expect(trainer.progress()).toHaveAttribute('value', '1');
  await trainer.nextExercise();
  const position = await trainer.board.position();
  const wrongEdition = bookPackFixture();
  wrongEdition.collection.sourceHash = '0'.repeat(64);

  await trainer.importStudyPack(wrongEdition);
  await expect(trainer.notice()).toContainText('Pack was not imported:');
  await expect(trainer.collection()).toHaveValue('ivashchenko-1a');
  await expect(trainer.exercise()).toHaveValue('3');
  await expect(trainer.exerciseOption(2)).toBeDisabled();
  await expect(trainer.progress()).toHaveAttribute('value', '1');
  await expect.poll(() => trainer.board.position()).toEqual(position);
  await trainer.previousExercise();
  await expect(trainer.exercise()).toHaveValue('1');
  await expect(trainer.stats()).toContainText('Solved first try');

  await trainer.nextExercise();
  await trainer.reload();
  await expect(trainer.collection()).toHaveValue('ivashchenko-1a');
  await expect(trainer.exercise()).toHaveValue('3');
  await expect(trainer.availableBookExercises()).toHaveCount(719);
  await expectBoardPosition(trainer.board, bookPuzzle(3).fen);
  await expect(trainer.progress()).toHaveAttribute('value', '1');
  await trainer.selectExercise(1);
  await expect(trainer.stats()).toContainText('Solved first try');
});
