import { practiceMateCase } from "../data/tacticalCases.ts";
import { test, expect } from "../fixtures/trainer.ts";
import { expectBoardPosition } from "../support/boardAssertions.ts";

test("keeps solved progress and the last visited exercise after refresh", async ({
  practice: trainer,
}) => {
  await expectBoardPosition(trainer.board, practiceMateCase.initialFen);
  await trainer.board.move("a2", "e6");
  await expect(trainer.board.square("d8")).toHaveAttribute(
    "aria-label",
    "d8 Black king",
  );
  await expect(trainer.feedback()).toContainText("Find the continuation");
  await expect(trainer.progress()).toHaveAttribute("value", "0");
  await trainer.board.move("f7", "f8");
  await expect(trainer.feedback()).toContainText("Correct! Checkmate.");
  await expect(trainer.board.square("f8")).toHaveAttribute(
    "aria-label",
    "f8 White queen",
  );
  await expect(trainer.progress()).toHaveAttribute("value", "1");
  await expect(trainer.stats()).toContainText("Solved first try");
  await expectBoardPosition(trainer.board, practiceMateCase.finalFen);
  await expect(trainer.historyMoves()).toHaveText([
    ...practiceMateCase.history,
  ]);
  await expect(trainer.board.root()).toHaveAttribute("aria-disabled", "true");
  await trainer.nextExercise();
  await expect(trainer.exercise()).toHaveValue("2");
  await trainer.reload();
  await expect(trainer.collection()).toHaveValue("lichess-practice");
  await expect(trainer.exercise()).toHaveValue("2");
  await expect(trainer.board.square("e8")).toHaveAttribute(
    "aria-label",
    "e8 Black rook",
  );
  await expect(trainer.progress()).toHaveAttribute("value", "1");
  await trainer.previousExercise();
  await expect(trainer.exercise()).toHaveValue("1");
  await expect(trainer.stats()).toContainText("Solved first try");
});

test("navigates by exercise and chapter without crossing collection boundaries", async ({
  practice: trainer,
}) => {
  await expect(trainer.previousExerciseButton()).toBeDisabled();
  await trainer.nextExercise();
  await expect(trainer.exercise()).toHaveValue("2");
  await expect(trainer.board.square("e8")).toHaveAttribute(
    "aria-label",
    "e8 Black rook",
  );
  await trainer.previousExercise();
  await expect(trainer.board.square("a2")).toHaveAttribute(
    "aria-label",
    "a2 White bishop",
  );
  await trainer.selectExercise(4);
  await expect(trainer.nextExerciseButton()).toBeDisabled();
  await expect(trainer.board.square("e1")).toHaveAttribute(
    "aria-label",
    "e1 White bishop",
  );
  await trainer.selectChapter(2, "Forks & attraction");
  await expect(trainer.exercise()).toHaveValue("2");
  await trainer.selectChapter(1, "Mate in 2");
  await expect(trainer.exercise()).toHaveValue("1");
  await expect(trainer.previousExerciseButton()).toBeDisabled();
  await expect
    .poll(() => trainer.horizontalOverflow(), {
      message: "The study layout must fit the viewport",
    })
    .toBeLessThanOrEqual(1);
});

test("wrong and illegal attempts preserve the position and remain counted after a later solve", async ({
  practice: trainer,
}) => {
  const initial = await trainer.board.position();
  await expectBoardPosition(trainer.board, practiceMateCase.initialFen);
  await trainer.board.move("f1", "g1");
  await expect(trainer.feedback()).toContainText(
    "Incorrect. Try another move.",
  );
  await expect.poll(() => trainer.board.position()).toEqual(initial);
  await trainer.board.move("a2", "a4");
  await expect(trainer.feedback()).toContainText("That move is illegal.");
  await expect.poll(() => trainer.board.position()).toEqual(initial);
  await expect(trainer.stats()).toContainText("2 attempts");
  await expect(trainer.progress()).toHaveAttribute("value", "0");
  await expect(trainer.historyMoves()).toHaveCount(0);
  await trainer.board.move("a2", "e6");
  await trainer.board.move("f7", "f8");
  await expect(trainer.feedback()).toHaveText(practiceMateCase.feedback);
  await expect(trainer.stats()).toContainText("4 attempts");
  await expect(trainer.stats()).toContainText("✓ Completed");
  await expect(trainer.stats()).not.toContainText("Solved first try");
  await expect(trainer.progress()).toHaveAttribute("value", "1");
  await trainer.reload();
  await expect(trainer.stats()).toContainText("4 attempts");
  await expect(trainer.stats()).toContainText("✓ Completed");
  await expect(trainer.stats()).not.toContainText("Solved first try");
});

test("hints escalate without changing the board or awarding a solve", async ({
  practice: trainer,
}) => {
  const initial = await trainer.board.position();
  await expectBoardPosition(trainer.board, practiceMateCase.initialFen);
  await expect.poll(() => trainer.board.hintedSquares()).toEqual([]);
  await trainer.requestHint();
  await expect(trainer.hintMessage()).toContainText("Hint 1:");
  await expect.poll(() => trainer.board.position()).toEqual(initial);
  await trainer.requestHint();
  await trainer.requestHint();
  await expect(trainer.board.square("a2")).toHaveAttribute("data-hint", "true");
  await expect(trainer.hintMessage()).toHaveText(
    "Hint 3: Look closely at the piece on a2.",
  );
  await expect.poll(() => trainer.board.position()).toEqual(initial);
  await expect(trainer.historyMoves()).toHaveCount(0);
  await expect(trainer.stats()).toContainText("0 attempts");
  await expect(trainer.stats()).toContainText("3 hints");
  await expect(trainer.progress()).toHaveAttribute("value", "0");
});

test("solution playback follows the complete line without awarding progress", async ({
  practice: trainer,
}) => {
  await trainer.revealSolution();
  const play = trainer.playNextMoveButton();
  await trainer.playNextMove();
  await expect(trainer.board.square("e6")).toHaveAttribute(
    "aria-label",
    "e6 White bishop",
  );
  await trainer.playNextMove();
  await expect(trainer.board.square("d8")).toHaveAttribute(
    "aria-label",
    "d8 Black king",
  );
  await trainer.playNextMove();
  await expect(trainer.board.square("f8")).toHaveAttribute(
    "aria-label",
    "f8 White queen",
  );
  await expect(play).toBeDisabled();
  await expect(trainer.progress()).toHaveAttribute("value", "0");
  await expectBoardPosition(trainer.board, practiceMateCase.finalFen);
  await expect(trainer.historyMoves()).toHaveText([
    ...practiceMateCase.history,
  ]);
  await expect(trainer.stats()).toContainText("0 attempts");
  await expect(trainer.stats()).not.toContainText("✓ Completed");
  await expect(trainer.board.root()).toHaveAttribute("aria-disabled", "true");
});

test("retry clears hints, playback history and the revealed solution", async ({
  practice: trainer,
}) => {
  const initial = await trainer.board.position();
  await trainer.requestHint();
  await trainer.requestHint();
  await trainer.requestHint();
  await trainer.revealSolution();
  await trainer.playNextMove();
  await trainer.playNextMove();
  await trainer.playNextMove();
  await trainer.retryExercise();
  await expect.poll(() => trainer.board.position()).toEqual(initial);
  await expect(trainer.hintMessage()).toHaveCount(0);
  await expect.poll(() => trainer.board.hintedSquares()).toEqual([]);
  await expect(trainer.solutionPanel()).toHaveCount(0);
  await expectBoardPosition(trainer.board, practiceMateCase.initialFen);
  await expect(trainer.historyMoves()).toHaveCount(0);
  await expect(trainer.board.root()).toHaveAttribute("aria-disabled", "false");
  await expect(trainer.hintButton()).toBeEnabled();
  await expect(trainer.progress()).toHaveAttribute("value", "0");
});

for (const { assistance, actions } of [
  { assistance: "hint", actions: ["requestHint"] },
  { assistance: "retry", actions: ["retryExercise"] },
  {
    assistance: "playback and retry",
    actions: [
      "revealSolution",
      "playNextMove",
      "playNextMove",
      "playNextMove",
      "retryExercise",
    ],
  },
  {
    assistance: "hints, playback and retry",
    actions: [
      "requestHint",
      "requestHint",
      "requestHint",
      "revealSolution",
      "playNextMove",
      "playNextMove",
      "playNextMove",
      "retryExercise",
    ],
  },
] as const) {
  test(`a solve after ${assistance} is completed without first-try credit`, async ({
    practice: trainer,
  }) => {
    for (const action of actions) await trainer[action]();
    await trainer.board.move("a2", "e6");
    await trainer.board.move("f7", "f8");
    await expect(trainer.feedback()).toContainText("Correct! Checkmate.");
    await expect(trainer.stats()).toContainText("✓ Completed");
    await expect(trainer.stats()).not.toContainText("Solved first try");
    await expect(trainer.feedback()).toHaveText(practiceMateCase.feedback);
    await expectBoardPosition(trainer.board, practiceMateCase.finalFen);
    await expect(trainer.historyMoves()).toHaveText([
      ...practiceMateCase.history,
    ]);
    await expect(trainer.progress()).toHaveAttribute("value", "1");
    await expect(trainer.board.root()).toHaveAttribute("aria-disabled", "true");
  });
}

test("cancelled reset keeps progress and confirmed reset starts a fresh session", async ({
  practice: trainer,
}) => {
  await trainer.board.move("a2", "e6");
  await trainer.board.move("f7", "f8");
  await trainer.nextExercise();
  await trainer.requestHint();
  await trainer.revealSolution();
  await trainer.playNextMove();
  await expect(trainer.board.square("e1")).toHaveAttribute(
    "aria-label",
    "e1 Black rook",
  );
  await trainer.requestProgressReset();
  await expect(trainer.resetDialog()).toHaveAccessibleName(
    "Reset all study progress?",
  );
  await trainer.cancelProgressReset();
  await expect(trainer.resetDialog()).toHaveCount(0);
  await expect(trainer.progress()).toHaveAttribute("value", "1");
  await expect(trainer.hintMessage()).toBeVisible();
  await expect(trainer.board.square("e1")).toHaveAttribute(
    "aria-label",
    "e1 Black rook",
  );
  await trainer.requestProgressReset();
  await expect(trainer.resetDialog()).toHaveAccessibleName(
    "Reset all study progress?",
  );
  await trainer.confirmProgressReset();
  await expect(trainer.resetDialog()).toHaveCount(0);
  await expect(trainer.progress()).toHaveAttribute("value", "0");
  await expect(trainer.exercise()).toHaveValue("2");
  await expect(trainer.board.square("e8")).toHaveAttribute(
    "aria-label",
    "e8 Black rook",
  );
  await expect(trainer.hintMessage()).toHaveCount(0);
  await expect(trainer.solutionPanel()).toHaveCount(0);
  await expect(trainer.stats()).toContainText("0 attempts");
  await trainer.reload();
  await expect(trainer.progress()).toHaveAttribute("value", "0");
  await expect(trainer.exercise()).toHaveValue("2");
});
