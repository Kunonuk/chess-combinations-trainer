import { Chess } from 'chess.js';
import type { PuzzlePack, Puzzle } from '../../src/types/puzzle.ts';
// Deterministic chess-rule fixtures, not represented as exercises from the book.
export function mateFixture(): Puzzle {
  const c = new Chess();
  ['f3', 'e5', 'g4'].forEach((m) => c.move(m));
  return {
    id: 1,
    stage: 1,
    chapter: 'Mate in 1',
    objective: 'mate-in-1',
    description: 'Black to move. Find checkmate.',
    fen: c.fen(),
    sideToMove: 'black',
    solutions: [
      { uci: ['d8h4'], san: ['Qh4#'], explanation: 'The exposed diagonal allows checkmate.' },
    ],
    hints: ['Look for a forcing check.', 'Consider your queen.'],
    source: { book: 'Rules test fixture', exercise: 1, url: 'https://jhlywa.github.io/chess.js/' },
    verification: {
      status: 'verified',
      method: 'Rules fixture',
      reviewer: 'Test suite',
      evidence: 'Legal move and checkmate verified.',
    },
  };
}
export function packFixture(): PuzzlePack {
  return {
    schemaVersion: 1,
    collection: {
      id: 'test-fixtures',
      title: 'Test fixtures',
      kind: 'practice',
      total: 20,
      license: 'CC0',
    },
    puzzles: [mateFixture()],
  };
}
