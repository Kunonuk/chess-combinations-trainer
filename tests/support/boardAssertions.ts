import { expect } from '@playwright/test';
import { Chess, type PieceSymbol, type Square } from 'chess.js';
import type { ChessBoard, BoardOrientation } from '../pages/components/ChessBoard.ts';

const pieceNames: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

export async function expectBoardPosition(
  board: ChessBoard,
  fen: string,
  orientation: BoardOrientation = 'white',
): Promise<void> {
  const chess = new Chess(fen);
  const expected = Array.from({ length: 64 }, (_, index) => {
    const square = `${String.fromCharCode(97 + (index % 8))}${8 - Math.floor(index / 8)}` as Square;
    const piece = chess.get(square);
    return piece
      ? `${square} ${piece.color === 'w' ? 'White' : 'Black'} ${pieceNames[piece.type]}`
      : `${square} empty`;
  });
  if (orientation === 'black') expected.reverse();
  await expect
    .poll(() => board.position(), { message: `Board matches FEN ${fen}` })
    .toEqual(expected);
}
