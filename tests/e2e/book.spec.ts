import { bookPuzzle, bookPuzzles, tacticalCases } from "../data/book.ts";
import { sourceErrorCase } from "../data/tacticalCases.ts";
import { test, expect } from "../fixtures/trainer.ts";
import { expectBoardPosition } from "../support/boardAssertions.ts";

test("renders every original book position and preserves the last exercise", async ({
  trainer,
}) => {
  test.setTimeout(180000);
  await trainer.open();
  await expect(trainer.collection()).toHaveValue("ivashchenko-1a");
  await expect(trainer.availableBookExercises()).toHaveCount(719);
  await expect(trainer.progress()).toHaveAttribute("max", "718");
  const exercise = trainer.exercise();
  for (const puzzle of bookPuzzles) {
    await test.step(`Render book exercise ${puzzle.id}`, async () => {
      await trainer.selectExercise(puzzle.id);
      await expect(trainer.exerciseNumber()).toHaveText(
        `EXERCISE ${String(puzzle.id).padStart(3, "0")}`,
      );
      await expectBoardPosition(trainer.board, puzzle.fen);
    });
  }
  await expect(trainer.nextExerciseButton()).toBeDisabled();
  await trainer.reload();
  await expect(exercise).toHaveValue("719");
  await expectBoardPosition(trainer.board, bookPuzzle(719).fen);
});

for (const tacticalCase of tacticalCases) {
  test(`solves book exercise ${tacticalCase.id} (${tacticalCase.objective}) independently`, async ({
    trainer,
  }) => {
    await trainer.open();
    await trainer.selectExercise(tacticalCase.id);
    await expectBoardPosition(trainer.board, tacticalCase.initialFen);
    await expect(trainer.historyMoves()).toHaveCount(0);
    await expect(trainer.progress()).toHaveAttribute("value", "0");
    for (const uci of tacticalCase.playerMoves) {
      await trainer.board.playMove(uci);
    }
    await expectBoardPosition(trainer.board, tacticalCase.finalFen);
    await expect(trainer.historyMoves()).toHaveText([...tacticalCase.history]);
    await expect(trainer.feedback()).toHaveText(tacticalCase.feedback);
    await expect(trainer.stats()).toContainText("Solved first try");
    await expect(trainer.progress()).toHaveAttribute("value", "1");
    await expect(trainer.board.root()).toHaveAttribute("aria-disabled", "true");
    await expect(trainer.hintButton()).toBeDisabled();
  });
}

test("accumulates all 12 tactical solves and preserves progress after refresh", async ({
  trainer,
}) => {
  test.setTimeout(90000);
  await trainer.open();
  let completed = 0;
  for (const tacticalCase of tacticalCases) {
    await test.step(`Solve book exercise ${tacticalCase.id} (${tacticalCase.objective})`, async () => {
      await trainer.selectExercise(tacticalCase.id);
      for (const uci of tacticalCase.playerMoves) {
        await trainer.board.playMove(uci);
      }
      completed++;
      await expect(trainer.stats()).toContainText("Solved first try");
      await expect(trainer.progress()).toHaveAttribute(
        "value",
        String(completed),
      );
      await expect(trainer.feedback()).toHaveText(tacticalCase.feedback);
    });
  }
  await trainer.reload();
  await expect(trainer.exercise()).toHaveValue("719");
  await expect(trainer.progress()).toHaveAttribute("value", "12");
});

test("shows the original source error as unscored playback with the legal escape", async ({
  trainer,
}) => {
  await trainer.open();
  await trainer.selectExercise(389);
  await expectBoardPosition(trainer.board, sourceErrorCase.initialFen);
  await expect(trainer.studyHeading()).toBeVisible();
  await expect(trainer.studyHeading()).toHaveText("Study the source error");
  await expect(trainer.sourceNote()).toContainText(
    "printed attack fails to mate",
  );
  await expect(trainer.hintButton()).toBeDisabled();
  const next = trainer.playNextMoveButton();
  for (let ply = 0; ply < 4; ply++) await trainer.playNextMove();
  await expect(next).toBeDisabled();
  await expect(trainer.board.square("h3")).toHaveAttribute(
    "aria-label",
    "h3 White king",
  );
  await expectBoardPosition(trainer.board, sourceErrorCase.finalFen);
  await expect(trainer.stats()).toContainText("Source note · not scored");
  await expect(trainer.exerciseOption(389)).toHaveText("#389 · source note");
  await expect(trainer.historyMove(0)).toHaveText("1... Rh2+");
  await expect(trainer.historyMove(1)).toHaveText("2. Nxh2");
  await expect(trainer.historyMove(2)).toHaveText("Qh1+");
  await expect(trainer.historyMove(3)).toHaveText("3. Kh3");
  await expect(trainer.historyMoves()).toHaveText([...sourceErrorCase.history]);
  await expect(trainer.progress()).toHaveAttribute("value", "0");
  await trainer.retryExercise();
  await expect(trainer.board.square("g2")).toHaveAttribute(
    "aria-label",
    "g2 White king",
  );
  await expect(trainer.hintButton()).toBeDisabled();
  await trainer.nextExercise();
  await expect(trainer.exercise()).toHaveValue("390");
  await expect(trainer.hintButton()).toBeEnabled();
});
