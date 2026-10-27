import { expect, test } from "../fixtures/trainer.ts";
import {
  promotionCases,
  promotionInitialFen,
  promotionPack,
} from "../fixtures/promotion.ts";
import { expectBoardPosition } from "../support/boardAssertions.ts";

for (const expected of promotionCases) {
  test(`chooses ${expected.name.toLowerCase()} promotion and records the resulting position`, async ({
    trainer,
  }) => {
    await trainer.open();
    await trainer.importStudyPack(promotionPack(expected.piece));
    await expect(trainer.notice()).toContainText(
      "Imported 1 verified book exercises",
    );
    await trainer.board.move("a7", "a8");
    await expect(trainer.board.promotionDialog()).toHaveAccessibleName(
      "Choose your promotion",
    );
    await expect(trainer.board.root()).toHaveAttribute("aria-disabled", "true");
    await trainer.board.choosePromotion(expected.piece);
    await expect(trainer.board.promotionDialog()).toHaveCount(0);
    await expectBoardPosition(trainer.board, expected.finalFen);
    await expect(trainer.historyMoves()).toHaveText([`1. ${expected.san}`]);
    await expect(trainer.feedback()).toContainText(
      "Correct! You found the winning combination.",
    );
    await expect(trainer.stats()).toContainText("1 attempts");
    await expect(trainer.stats()).toContainText("Solved first try");
    await expect(trainer.progress()).toHaveAttribute("value", "1");
  });
}

test("cancelled promotion preserves the pawn, position and unscored attempt", async ({
  trainer,
}) => {
  await trainer.open();
  await trainer.importStudyPack(promotionPack("q"));
  await expect(trainer.notice()).toContainText(
    "Imported 1 verified book exercises",
  );
  await trainer.board.move("a7", "a8");
  await trainer.board.cancelPromotion();
  await expect(trainer.board.promotionDialog()).toHaveCount(0);
  await expectBoardPosition(trainer.board, promotionInitialFen);
  await expect(trainer.board.root()).toHaveAttribute("aria-disabled", "false");
  await expect(trainer.stats()).toContainText("0 attempts");
  await expect(trainer.progress()).toHaveAttribute("value", "0");
  await expect(trainer.historyMoves()).toHaveCount(0);
  await trainer.board.playMove("a7a8q");
  await expect(trainer.progress()).toHaveAttribute("value", "1");
});
