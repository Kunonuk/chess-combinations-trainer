import bookData from "../../src/data/book.json" with { type: "json" };

type BookPuzzle = (typeof bookData.puzzles)[number];

export const bookPuzzles: readonly BookPuzzle[] = bookData.puzzles;

export function bookPuzzle(id: number): BookPuzzle {
  const puzzle = bookPuzzles.find((puzzle) => puzzle.id === id);
  if (!puzzle)
    throw new Error(`Book exercise ${id} is missing from the test data`);
  return puzzle;
}

export { tacticalCases } from "./tacticalCases.ts";
