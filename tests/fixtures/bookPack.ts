import type { PuzzlePack } from '../../src/types/puzzle.ts';
import { fixturePuzzle, mateFixture, repetitionFixture } from './puzzles.ts';

export function bookPackFixture(): PuzzlePack {
  const black = mateFixture();
  const white = {
    ...mateFixture(),
    id: 3,
    stage: 2,
    chapter: 'Promotion',
    sideToMove: 'white' as const,
    fen: '7k/5P2/6K1/8/8/8/8/8 w - - 0 1',
    solutions: [{ uci: ['f7f8q'], san: ['f8=Q#'], explanation: 'Promote for checkmate.' }],
    source: {
      book: 'Synthetic rule fixture, not a book exercise',
      exercise: 3,
      page: 10,
      solutionPage: 132,
    },
  };
  return {
    schemaVersion: 1,
    collection: {
      id: 'ivashchenko-1a',
      title: 'Synthetic import fixture',
      kind: 'book',
      total: 719,
      license: 'private-use-only',
      sourceHash: '742323aafa1d76b854b4f323d71826f2ead8a65cd72964f8bc65fbd846420f86',
    },
    puzzles: [
      {
        ...black,
        source: {
          book: 'Synthetic rule fixture, not a book exercise',
          exercise: 1,
          page: 10,
          solutionPage: 132,
        },
      },
      white,
    ],
  };
}

export function repetitionBookPackFixture(side: 'white' | 'black'): PuzzlePack {
  const pack = bookPackFixture();
  const puzzle = repetitionFixture(side);
  puzzle.source = { ...fixturePuzzle(pack).source, exercise: 1 };
  return { ...pack, puzzles: [puzzle] };
}
