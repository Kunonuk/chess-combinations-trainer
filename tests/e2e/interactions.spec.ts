import { expect, test } from "../fixtures/trainer.ts";
import { practiceMateCase } from "../data/tacticalCases.ts";
import { expectBoardPosition } from "../support/boardAssertions.ts";

for (const { orientation, preparation } of [
  { orientation: "white", preparation: [] },
  { orientation: "black", preparation: ["flipBoard"] },
] as const) {
  test(`solves with real mouse dragging from the ${orientation} orientation`, async ({
    practice: trainer,
  }) => {
    for (const action of preparation) await trainer[action]();
    await trainer.board.moveByDrag("a2", "e6");
    await expect(trainer.feedback()).toContainText("Find the continuation");
    await expect(trainer.board.square("d8")).toHaveAttribute(
      "aria-label",
      "d8 Black king",
    );
    await trainer.board.moveByDrag("f7", "f8");
    await expect(trainer.feedback()).toContainText("Correct! Checkmate.");
    await expectBoardPosition(
      trainer.board,
      practiceMateCase.finalFen,
      orientation,
    );
    await expect(trainer.historyMoves()).toHaveText([
      "18. Be6+",
      "Kd8",
      "19. Qf8#",
    ]);
    await expect(trainer.stats()).toContainText("Solved first try");
    await expect(trainer.progress()).toHaveAttribute("value", "1");
  });
}

test("dragging outside the board preserves the position and attempt count", async ({
  practice: trainer,
}) => {
  await trainer.board.dragOutsideBoard("a2");
  await expectBoardPosition(trainer.board, practiceMateCase.initialFen);
  await expect(trainer.stats()).toContainText("0 attempts");
  await expect(trainer.historyMoves()).toHaveCount(0);
  await expect(trainer.board.square("a2")).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await expect(trainer.progress()).toHaveAttribute("value", "0");
});

test("solves using keyboard selection and arrow navigation", async ({
  practice: trainer,
}) => {
  await trainer.enterBoardFromHeader();
  await expect(trainer.board.square("a8")).toBeFocused();
  await trainer.board.navigateFocus("a8", "a2");
  await trainer.board.moveByKeyboard("a2", "e6");
  await expect(trainer.feedback()).toContainText("Find the continuation");
  await trainer.board.navigateFocus("e6", "f7");
  await trainer.board.moveByKeyboard("f7", "f8");
  await expect(trainer.feedback()).toContainText("Correct! Checkmate.");
  await expectBoardPosition(trainer.board, practiceMateCase.finalFen);
  await expect(trainer.historyMoves()).toHaveText([
    "18. Be6+",
    "Kd8",
    "19. Qf8#",
  ]);
  await expect(trainer.board.root()).toHaveAttribute("aria-disabled", "true");
  // Keyboard events still reach aria-disabled cells; the application must ignore them.
  await trainer.board.navigateFocus("f8", "e6");
  await trainer.board.moveByKeyboard("e6", "d7");
  await expectBoardPosition(trainer.board, practiceMateCase.finalFen);
  await expect(trainer.stats()).toContainText("2 attempts");
  await expect(trainer.progress()).toHaveAttribute("value", "1");
});

test("Escape cancels keyboard selection without recording a move", async ({
  practice: trainer,
}) => {
  await trainer.enterBoardFromHeader();
  await trainer.board.navigateFocus("a8", "a2");
  await trainer.board.selectFocusedSquare();
  await expect(trainer.board.square("a2")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await trainer.board.cancelKeyboardSelection();
  await expect(trainer.board.square("a2")).toHaveAttribute(
    "aria-selected",
    "false",
  );
  await expectBoardPosition(trainer.board, practiceMateCase.initialFen);
  await expect(trainer.stats()).toContainText("0 attempts");
});
