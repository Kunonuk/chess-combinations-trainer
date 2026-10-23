import { test, expect } from '../fixtures/trainer.ts';

test('applies appearance changes and retains both settings across refreshes', async ({
  practice: trainer,
}) => {
  const app = trainer.root();
  const boardTheme = trainer.boardTheme();
  const { app: originalBackground, square: originalSquare } = await trainer.appearanceColors();
  await trainer.selectBoardTheme('walnut');
  await trainer.toggleAppearance();
  await expect(app).toHaveClass(/dark/);
  await expect(app).not.toHaveCSS('background-color', originalBackground);
  await expect(trainer.board.square('a1')).not.toHaveCSS('background-color', originalSquare);
  await trainer.reload();
  await expect(boardTheme).toHaveValue('walnut');
  await expect(trainer.appearanceToggle()).toBeVisible();
  await expect(trainer.appearanceToggle()).toHaveAccessibleName('Use light appearance');
  await expect(app).toHaveClass(/dark/);
  await expect(app).not.toHaveCSS('background-color', originalBackground);
  await expect(trainer.board.square('a1')).not.toHaveCSS('background-color', originalSquare);

  await trainer.selectBoardTheme('forest');
  await expect(trainer.appearanceToggle()).toBeVisible();
  await expect(trainer.appearanceToggle()).toHaveAccessibleName('Use light appearance');
  await trainer.toggleAppearance();
  await trainer.reload();
  await expect(boardTheme).toHaveValue('forest');
  await expect(trainer.appearanceToggle()).toBeVisible();
  await expect(trainer.appearanceToggle()).toHaveAccessibleName('Use dark appearance');
  await expect(app).not.toHaveClass(/dark/);
  await expect(app).toHaveCSS('background-color', originalBackground);
  await expect(trainer.board.square('a1')).toHaveCSS('background-color', originalSquare);
});

test('resetting study progress preserves appearance after refresh', async ({
  practice: trainer,
}) => {
  await trainer.selectBoardTheme('walnut');
  await trainer.toggleAppearance();
  await trainer.requestHint();
  await expect(trainer.hintMessage()).toBeVisible();
  await trainer.requestProgressReset();
  await trainer.confirmProgressReset();
  await expect(trainer.hintMessage()).toHaveCount(0);
  await trainer.reload();
  await expect(trainer.boardTheme()).toHaveValue('walnut');
  await expect(trainer.appearanceToggle()).toBeVisible();
  await expect(trainer.appearanceToggle()).toHaveAccessibleName('Use light appearance');
  await expect(trainer.root()).toHaveClass(/dark/);
  await expect(trainer.progress()).toHaveAttribute('value', '0');
});
