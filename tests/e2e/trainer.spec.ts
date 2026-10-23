import {
  test,
  expect,
  openPractice,
  square,
  movePiece,
  boardPosition,
} from '../support/trainer.ts';

test('keeps solved progress and the last visited exercise after refresh', async ({
  page,
  isMobile,
}) => {
  await openPractice(page);
  await movePiece(page, 'a2', 'e6', isMobile);
  await expect(square(page, 'd8')).toHaveAttribute('aria-label', 'd8 Black king');
  await expect(page.locator('.feedback')).toContainText('Find the continuation');
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '0',
  );
  await movePiece(page, 'f7', 'f8', isMobile);
  await expect(page.locator('.feedback')).toContainText('Correct! Checkmate.');
  await expect(square(page, 'f8')).toHaveAttribute('aria-label', 'f8 White queen');
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '1',
  );
  await expect(page.locator('.exercise-stats')).toContainText('Solved first try');
  await page.getByRole('button', { name: 'Next exercise', exact: true }).click();
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('2');
  await page.reload();
  await expect(page.getByLabel('Collection', { exact: true })).toHaveValue('lichess-practice');
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('2');
  await expect(square(page, 'e8')).toHaveAttribute('aria-label', 'e8 Black rook');
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '1',
  );
  await page.getByRole('button', { name: 'Previous exercise', exact: true }).click();
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('1');
  await expect(page.locator('.exercise-stats')).toContainText('Solved first try');
});

test('navigates by exercise and chapter without crossing collection boundaries', async ({
  page,
}) => {
  await openPractice(page);
  await expect(page.getByRole('button', { name: 'Previous exercise', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Next exercise', exact: true }).click();
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('2');
  await expect(square(page, 'e8')).toHaveAttribute('aria-label', 'e8 Black rook');
  await page.getByRole('button', { name: 'Previous exercise', exact: true }).click();
  await expect(square(page, 'a2')).toHaveAttribute('aria-label', 'a2 White bishop');
  await page.getByLabel('Exercise', { exact: true }).selectOption('4');
  await expect(page.getByRole('button', { name: 'Next exercise', exact: true })).toBeDisabled();
  await expect(square(page, 'e1')).toHaveAttribute('aria-label', 'e1 White bishop');
  await page.getByLabel('Stage & chapter', { exact: true }).selectOption('2|Forks & attraction');
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('2');
  await page.getByLabel('Stage & chapter', { exact: true }).selectOption('1|Mate in 2');
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Previous exercise', exact: true })).toBeDisabled();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    'The study layout must fit the viewport',
  ).toBeLessThanOrEqual(1);
});

test('wrong and illegal moves preserve the position and do not complete an exercise', async ({
  page,
  isMobile,
}) => {
  await openPractice(page);
  const initial = await boardPosition(page);
  await movePiece(page, 'f1', 'g1', isMobile);
  await expect(page.locator('.feedback')).toContainText('Incorrect. Try another move.');
  expect(await boardPosition(page)).toEqual(initial);
  await movePiece(page, 'a2', 'a4', isMobile);
  await expect(page.locator('.feedback')).toContainText('That move is illegal.');
  expect(await boardPosition(page)).toEqual(initial);
  await expect(page.locator('.exercise-stats')).toContainText('2 attempts');
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '0',
  );
});

test('hints, playback and retry do not award an assisted first-try solve', async ({
  page,
  isMobile,
}) => {
  await openPractice(page);
  const initial = await boardPosition(page);
  await expect(page.locator('[data-hint="true"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(page.locator('.hint-message')).toContainText('Hint 1:');
  expect(await boardPosition(page)).toEqual(initial);
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await expect(square(page, 'a2')).toHaveAttribute('data-hint', 'true');
  await page.getByRole('button', { name: 'Show solution', exact: true }).click();
  const play = page.getByRole('button', { name: /Play next move/ });
  await play.click();
  await expect(square(page, 'e6')).toHaveAttribute('aria-label', 'e6 White bishop');
  await play.click();
  await expect(square(page, 'd8')).toHaveAttribute('aria-label', 'd8 Black king');
  await play.click();
  await expect(square(page, 'f8')).toHaveAttribute('aria-label', 'f8 White queen');
  await expect(play).toBeDisabled();
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '0',
  );
  await page.getByRole('button', { name: 'Retry exercise', exact: true }).click();
  expect(await boardPosition(page)).toEqual(initial);
  await expect(page.locator('.hint-message')).toHaveCount(0);
  await expect(page.locator('[data-hint="true"]')).toHaveCount(0);
  await expect(page.getByText('Study the solution', { exact: true })).toHaveCount(0);
  await movePiece(page, 'a2', 'e6', isMobile);
  await movePiece(page, 'f7', 'f8', isMobile);
  await expect(page.locator('.feedback')).toContainText('Correct! Checkmate.');
  await expect(page.locator('.exercise-stats')).toContainText('✓ Completed');
  await expect(page.locator('.exercise-stats')).not.toContainText('Solved first try');
});

test('cancelled reset keeps progress and confirmed reset starts a fresh session', async ({
  page,
  isMobile,
}) => {
  await openPractice(page);
  await movePiece(page, 'a2', 'e6', isMobile);
  await movePiece(page, 'f7', 'f8', isMobile);
  await page.getByRole('button', { name: 'Next exercise', exact: true }).click();
  await page.getByRole('button', { name: 'Hint', exact: true }).click();
  await page.getByRole('button', { name: 'Show solution', exact: true }).click();
  await page.getByRole('button', { name: /Play next move/ }).click();
  await expect(square(page, 'e1')).toHaveAttribute('aria-label', 'e1 Black rook');
  await page.getByRole('button', { name: 'Reset study progress', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Reset all study progress?' });
  await dialog.getByRole('button', { name: 'Keep progress', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '1',
  );
  await expect(page.locator('.hint-message')).toBeVisible();
  await expect(square(page, 'e1')).toHaveAttribute('aria-label', 'e1 Black rook');
  await page.getByRole('button', { name: 'Reset study progress', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Reset all study progress?' });
  await dialog.getByRole('button', { name: 'Reset progress', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '0',
  );
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('2');
  await expect(square(page, 'e8')).toHaveAttribute('aria-label', 'e8 Black rook');
  await expect(page.locator('.hint-message')).toHaveCount(0);
  await expect(page.getByText('Study the solution', { exact: true })).toHaveCount(0);
  await expect(page.locator('.exercise-stats')).toContainText('0 attempts');
  await page.reload();
  await expect(page.getByRole('progressbar', { name: 'Collection progress' })).toHaveAttribute(
    'value',
    '0',
  );
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('2');
});
