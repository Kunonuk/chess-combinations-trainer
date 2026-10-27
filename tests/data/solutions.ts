import type { Puzzle } from "../../src/types/puzzle.ts";

export function playerMoves(puzzle: Pick<Puzzle, "solutions">): string[] {
  const solution = puzzle.solutions[0];
  if (!solution) throw new Error("The test puzzle must have a solution");
  // The trainer automatically plays the opponent replies.
  return solution.uci.filter((_, ply) => ply % 2 === 0);
}
