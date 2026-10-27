import { describe, it, expect } from "vitest";
import {
  analysisFixture,
  fixturePuzzle,
  packFixture,
} from "../fixtures/puzzles.ts";
import { validatePack } from "../../src/services/puzzleValidation.ts";
import {
  createSession,
  attemptMove,
  advanceSolution,
} from "../../src/services/chessEngine.ts";

describe("source-error studies", () => {
  it("retains a source note and a legal even-length illustrative line", () => {
    const pack = packFixture();
    pack.puzzles = [analysisFixture()];
    const study = fixturePuzzle(validatePack(pack));
    expect(study.notes).toEqual(analysisFixture().notes);
    expect(study.solutions[0]!.san).toEqual(["e4", "e5"]);
  });
  it("requires a source note instead of silently changing the objective", () => {
    const pack = packFixture();
    const puzzle = analysisFixture();
    delete puzzle.notes;
    pack.puzzles = [puzzle];
    expect(() => validatePack(pack)).toThrow(/source note/i);
  });
  it("starts in playback mode and cannot award a solve for the printed mistake", () => {
    const puzzle = analysisFixture();
    const initial = createSession(puzzle);
    expect(initial.status).toBe("revealed");
    expect(attemptMove(puzzle, initial, "e2e4")).toEqual({
      session: initial,
      outcome: "blocked",
    });
    const first = advanceSolution(puzzle, initial);
    const last = advanceSolution(puzzle, first);
    expect(last.history).toEqual(["e2e4", "e7e5"]);
    expect(last.status).toBe("revealed");
    expect(advanceSolution(puzzle, last)).toEqual(last);
    expect(initial.history).toEqual([]);
  });
  it("rejects malformed source notes", () => {
    const pack = packFixture();
    pack.puzzles = [analysisFixture()];
    const malformed = {
      ...pack,
      puzzles: pack.puzzles.map((puzzle) => ({ ...puzzle, notes: [42] })),
    };
    expect(() => validatePack(malformed)).toThrow(/note/i);
  });
});
