import { bookPackFixture } from '../fixtures/bookPack.ts';
import { expect, test, openPractice, square, importStudyJSON } from '../support/trainer.ts';

test('imports a verified pack with numbered gaps and restores it after refresh', async ({
  page,
}) => {
  await openPractice(page);
  await importStudyJSON(page, JSON.stringify(bookPackFixture()));
  await expect(page.getByText(/Imported 2 verified book exercises/)).toBeVisible();
  await expect(page.getByLabel('Collection', { exact: true })).toHaveValue('ivashchenko-1a');
  await expect(square(page, 'd8')).toHaveAttribute('aria-label', 'd8 Black queen');
  const exercises = page.getByLabel('Exercise', { exact: true });
  await expect(exercises.locator('option[value="2"]')).toBeDisabled();
  await page.getByRole('button', { name: 'Next exercise', exact: true }).click();
  await expect(exercises).toHaveValue('3');
  await expect(square(page, 'f7')).toHaveAttribute('aria-label', 'f7 White pawn');
  await expect(page.getByRole('button', { name: 'Next exercise', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel('Collection', { exact: true })).toHaveValue('ivashchenko-1a');
  await expect(exercises).toHaveValue('3');
  await expect(square(page, 'f7')).toHaveAttribute('aria-label', 'f7 White pawn');
  // Rejected replacement must also leave the valid cached pack intact.
  const wrongEdition = bookPackFixture();
  wrongEdition.collection.sourceHash = '0'.repeat(64);
  await importStudyJSON(page, JSON.stringify(wrongEdition));
  await expect(page.getByText(/Pack was not imported:/)).toBeVisible();
  await expect(exercises).toHaveValue('3');
  await page.reload();
  await expect(page.getByLabel('Collection', { exact: true })).toHaveValue('ivashchenko-1a');
  await expect(square(page, 'f7')).toHaveAttribute('aria-label', 'f7 White pawn');
});

test('malformed JSON leaves the current practice collection usable', async ({ page }) => {
  await openPractice(page);
  await importStudyJSON(page, '{');
  await expect(page.getByText(/Pack was not imported:/)).toBeVisible();
  await expect(page.getByLabel('Collection', { exact: true })).toHaveValue('lichess-practice');
  await expect(square(page, 'a2')).toHaveAttribute('aria-label', 'a2 White bishop');
  await page.getByRole('button', { name: 'Next exercise', exact: true }).click();
  await expect(page.getByLabel('Exercise', { exact: true })).toHaveValue('2');
  await expect(square(page, 'e8')).toHaveAttribute('aria-label', 'e8 Black rook');
});
