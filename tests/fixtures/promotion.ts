import type { PuzzlePack } from '../../src/types/puzzle.ts';
import type { PromotionPiece } from '../pages/components/ChessBoard.ts';
import { bookPackFixture } from './bookPack.ts';
import { fixturePuzzle } from './puzzles.ts';

// Independent, small rule positions for every promotion control; no book diagram is used.
export const promotionCases = [
  { piece: 'q', name: 'Queen', san: 'a8=Q+', finalFen: 'Q6k/7p/8/8/8/8/8/K7 b - - 0 1' },
  { piece: 'r', name: 'Rook', san: 'a8=R+', finalFen: 'R6k/7p/8/8/8/8/8/K7 b - - 0 1' },
  { piece: 'b', name: 'Bishop', san: 'a8=B', finalFen: 'B6k/7p/8/8/8/8/8/K7 b - - 0 1' },
  { piece: 'n', name: 'Knight', san: 'a8=N', finalFen: 'N6k/7p/8/8/8/8/8/K7 b - - 0 1' },
] as const;

export const promotionInitialFen = '7k/P6p/8/8/8/8/8/K7 w - - 0 1';

export function promotionPack(piece: PromotionPiece): PuzzlePack {
  const pack = bookPackFixture();
  const expected = promotionCases.find((item) => item.piece === piece);
  if (!expected) throw new Error(`Missing promotion test case: ${piece}`);
  return {
    ...pack,
    puzzles: [
      {
        ...fixturePuzzle(pack),
        objective: 'combination',
        chapter: 'Promotion controls',
        description: 'Promote the pawn.',
        sideToMove: 'white',
        fen: promotionInitialFen,
        solutions: [
          {
            uci: [`a7a8${piece}`],
            san: [expected.san],
            explanation: 'Exercise the chosen promotion control.',
          },
        ],
        hints: [],
      },
    ],
  };
}
