import { expect, test } from "../fixtures/trainer.ts";

test("serves the trainer at its project path without browser errors", async ({
  trainer,
  page,
  baseURL,
}) => {
  const response = await trainer.open();
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(baseURL!);
  await expect(page).toHaveTitle("Combinations — Chess Trainer");
  await expect(trainer.main()).toBeVisible();
  await expect(trainer.main()).toHaveRole("main");
  await expect(trainer.heading()).toBeVisible();
  await expect(trainer.heading()).toMatchAriaSnapshot(
    '- heading "Find the beautiful move." [level=1]',
  );
});
