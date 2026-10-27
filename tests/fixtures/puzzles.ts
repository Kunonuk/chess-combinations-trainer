import { Chess } from "chess.js";
import type { PuzzlePack, Puzzle } from "../../src/types/puzzle.ts";

// Keep packs mutable for invalid-data tests; guard indexed fixture assumptions at the point of use.
export function fixturePuzzle(pack: PuzzlePack, index = 0): Puzzle {
  const puzzle = pack.puzzles[index];
  if (!puzzle) {
    throw new Error(
      `Fixture "${pack.collection.id}" has no puzzle at index ${index}.`,
    );
  }
  return puzzle;
}

// Deterministic chess-rule fixtures, not represented as exercises from the book.
export function mateFixture(): Puzzle {
  const c = new Chess();
  ["f3", "e5", "g4"].forEach((m) => c.move(m));
  return {
    id: 1,
    stage: 1,
    chapter: "Mate in 1",
    objective: "mate-in-1",
    description: "Black to move. Find checkmate.",
    fen: c.fen(),
    sideToMove: "black",
    solutions: [
      {
        uci: ["d8h4"],
        san: ["Qh4#"],
        explanation: "The exposed diagonal allows checkmate.",
      },
    ],
    hints: ["Look for a forcing check.", "Consider your queen."],
    source: {
      book: "Rules test fixture",
      exercise: 1,
      url: "https://jhlywa.github.io/chess.js/",
    },
    verification: {
      status: "verified",
      method: "Rules fixture",
      reviewer: "Test suite",
      evidence: "Legal move and checkmate verified.",
    },
  };
}
export function packFixture(): PuzzlePack {
  return {
    schemaVersion: 1,
    collection: {
      id: "test-fixtures",
      title: "Test fixtures",
      kind: "practice",
      total: 20,
      license: "CC0",
    },
    puzzles: [mateFixture()],
  };
}

// Synthetic stalemate after an opponent capture; no book position is used.
export function drawFixture(sideToMove: "white" | "black" = "white"): Puzzle {
  const white = sideToMove === "white";
  return {
    ...mateFixture(),
    chapter: "Find a draw",
    objective: "draw",
    description: "Force stalemate.",
    sideToMove,
    fen: white
      ? "8/7q/8/8/8/2k5/1R6/K7 w - - 0 1"
      : "7k/6r1/5K2/8/8/8/Q7/8 b - - 0 1",
    solutions: [
      {
        uci: white ? ["b2b3", "c3b3"] : ["g7g6", "f6g6"],
        san: white ? ["Rb3+", "Kxb3"] : ["Rg6+", "Kxg6"],
        explanation: "The final rook capture leaves the player stalemated.",
      },
    ],
    hints: [],
  };
}

// Synthetic study-only line used to check source-erratum handling.
export function analysisFixture(): Puzzle {
  return {
    ...mateFixture(),
    id: 2,
    source: { ...mateFixture().source, exercise: 2 },
    objective: "analysis",
    description: "Study a documented error in a source exercise.",
    fen: new Chess().fen(),
    sideToMove: "white",
    notes: [
      "This synthetic source instruction is inconsistent; study the legal line without a score.",
    ],
    solutions: [
      {
        uci: ["e2e4", "e7e5"],
        san: ["e4", "e5"],
        explanation: "A legal illustrative line, not a forced win.",
      },
    ],
    hints: [],
  };
}

// Repeating knight cycles retain the position history needed for a draw claim.
export function repetitionFixture(side: "white" | "black" = "white"): Puzzle {
  const white = side === "white";
  const cycle = white
    ? ["g1f3", "g8f6", "f3g1", "f6g8"]
    : ["g8f6", "g1f3", "f6g8", "f3g1"];
  const sanCycle = white
    ? ["Nf3", "Nf6", "Ng1", "Ng8"]
    : ["Nf6", "Nf3", "Ng8", "Ng1"];
  return {
    ...drawFixture(side),
    fen: new Chess().fen().replace(" w ", white ? " w " : " b "),
    solutions: [
      {
        uci: [...cycle, ...cycle],
        san: [...sanCycle, ...sanCycle],
        explanation: "The position occurs for the third time.",
      },
    ],
  };
}
