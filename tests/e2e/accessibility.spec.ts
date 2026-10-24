import { expect, test } from '../fixtures/trainer.ts';
import { promotionInitialFen, promotionPack } from '../fixtures/promotion.ts';
import { expectBoardPosition } from '../support/boardAssertions.ts';

test('reset dialog traps keyboard focus, cancels with Escape and restores its trigger', async ({
  practice: trainer,
}) => {
  await trainer.requestHint();
  await trainer.requestProgressReset();
  await expect(trainer.resetDialog()).toHaveRole('dialog');
  await expect(trainer.resetDialog()).toHaveAccessibleName('Reset all study progress?');
  await expect(trainer.resetDialog()).toHaveAttribute('aria-modal', 'true');
  await expect(trainer.keepProgressButton()).toBeFocused();
  await trainer.pressDialogKey('Tab');
  await expect(trainer.confirmResetButton()).toBeFocused();
  await trainer.pressDialogKey('Tab');
  await expect(trainer.keepProgressButton()).toBeFocused();
  await trainer.pressDialogKey('Shift+Tab');
  await expect(trainer.confirmResetButton()).toBeFocused();
  await trainer.pressDialogKey('Escape');
  await expect(trainer.resetDialog()).toHaveCount(0);
  await expect(trainer.resetProgressButton()).toBeFocused();
  await expect(trainer.hintMessage()).toBeVisible();
});

test('confirmed reset returns focus to its trigger and clears assistance', async ({
  practice: trainer,
}) => {
  await trainer.requestHint();
  await trainer.requestProgressReset();
  await trainer.pressDialogKey('Tab');
  await trainer.pressDialogKey('Enter');
  await expect(trainer.resetDialog()).toHaveCount(0);
  await expect(trainer.resetProgressButton()).toBeFocused();
  await expect(trainer.hintMessage()).toHaveCount(0);
});

test('promotion dialog exposes labelled choices, traps focus and restores the board on Escape', async ({
  trainer,
}) => {
  await trainer.open();
  await trainer.importStudyPack(promotionPack('q'));
  await expect(trainer.notice()).toContainText('Imported 1 verified book exercises');
  await trainer.board.move('a7', 'a8');
  await expect(trainer.board.promotionDialog()).toHaveRole('dialog');
  await expect(trainer.board.promotionDialog()).toHaveAttribute('aria-modal', 'true');
  await expect(trainer.board.promotionOption('q')).toHaveAccessibleName('Queen');
  await expect(trainer.board.promotionOption('r')).toHaveAccessibleName('Rook');
  await expect(trainer.board.promotionOption('b')).toHaveAccessibleName('Bishop');
  await expect(trainer.board.promotionOption('n')).toHaveAccessibleName('Knight');
  await expect(trainer.board.promotionOption('q')).toBeFocused();
  await trainer.pressDialogKey('Shift+Tab');
  await expect(trainer.board.promotionCancel()).toBeFocused();
  await trainer.pressDialogKey('Tab');
  await expect(trainer.board.promotionOption('q')).toBeFocused();
  await trainer.pressDialogKey('Escape');
  await expect(trainer.board.promotionDialog()).toHaveCount(0);
  await expect(trainer.board.square('a8')).toBeFocused();
  await expectBoardPosition(trainer.board, promotionInitialFen);
  await expect(trainer.stats()).toContainText('0 attempts');
});
