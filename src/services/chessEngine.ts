import { Chess, type Square } from 'chess.js';
import type { Puzzle } from '../types/puzzle.ts';
export interface Session {
  fen: string;
  history: string[];
  san: string[];
  status: 'playing' | 'solved' | 'revealed';
  feedback: string;
  feedbackKind: 'neutral' | 'wrong' | 'illegal' | 'correct';
  lastMove: { from: Square; to: Square } | null;
  candidates: number[];
}
export type Outcome = 'illegal' | 'incorrect' | 'continue' | 'solved' | 'blocked';
function positionForSession(puzzle: Puzzle, session: Session): Chess {
  const chess = new Chess(puzzle.fen);
  for (const move of session.history) chess.move(move);
  return chess;
}
export function createSession(puzzle: Puzzle): Session {
  return {
    fen: puzzle.fen,
    history: [],
    san: [],
    status: puzzle.objective === 'analysis' ? 'revealed' : 'playing',
    feedback:
      puzzle.objective === 'analysis'
        ? 'Source discrepancy: study the annotated line. This exercise is not scored.'
        : 'Find the best move. Take your time.',
    feedbackKind: 'neutral',
    lastMove: null,
    candidates: puzzle.solutions.map((_, i) => i),
  };
}
export function attemptMove(
  puzzle: Puzzle,
  session: Session,
  uci: string,
): { session: Session; outcome: Outcome } {
  if (session.status !== 'playing') return { session, outcome: 'blocked' };
  const chess = positionForSession(puzzle, session);
  let move;
  try {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) throw new Error('bad UCI');
    move = chess.move(uci);
  } catch {
    return {
      session: { ...session, feedback: 'That move is illegal.', feedbackKind: 'illegal' },
      outcome: 'illegal',
    };
  }
  const ply = session.history.length;
  let candidates = session.candidates.filter((i) => puzzle.solutions[i]?.uci[ply] === uci);
  const alternateMate = puzzle.objective === 'mate-in-1' && chess.isCheckmate();
  if (!candidates.length && !alternateMate)
    return {
      session: { ...session, feedback: 'Incorrect. Try another move.', feedbackKind: 'wrong' },
      outcome: 'incorrect',
    };
  const history = [...session.history, uci],
    san = [...session.san, move.san];
  let solved =
    alternateMate || candidates.some((i) => puzzle.solutions[i]!.uci.length === history.length);
  let lastMove = { from: move.from, to: move.to };
  if (!solved) {
    const response = puzzle.solutions[candidates[0]!]!.uci[history.length]!;
    const reply = chess.move(response);
    history.push(response);
    san.push(reply.san);
    lastMove = { from: reply.from, to: reply.to };
    candidates = candidates.filter((i) => puzzle.solutions[i]!.uci[ply + 1] === response);
    solved =
      puzzle.objective === 'draw' &&
      chess.isDraw() &&
      candidates.some((i) => puzzle.solutions[i]!.uci.length === history.length);
  }
  return {
    session: {
      ...session,
      fen: chess.fen(),
      history,
      san,
      candidates,
      lastMove,
      status: solved ? 'solved' : 'playing',
      feedback: solved
        ? chess.isCheckmate()
          ? 'Correct! Checkmate.'
          : puzzle.objective === 'draw'
            ? 'Correct! Draw.'
            : 'Correct! You found the winning combination.'
        : 'Correct. Find the continuation.',
      feedbackKind: 'correct',
    },
    outcome: solved ? 'solved' : 'continue',
  };
}
export function revealSolution(puzzle: Puzzle, _session: Session): Session {
  return {
    ...createSession(puzzle),
    status: 'revealed',
    feedback: 'Solution revealed. Play through the verified line.',
    feedbackKind: 'neutral',
  };
}
export function advanceSolution(puzzle: Puzzle, session: Session): Session {
  if (session.status !== 'revealed') return session;
  const uci = puzzle.solutions[0]!.uci[session.history.length];
  if (!uci) return session;
  const c = positionForSession(puzzle, session),
    move = c.move(uci);
  return {
    ...session,
    fen: c.fen(),
    history: [...session.history, uci],
    san: [...session.san, move.san],
    lastMove: { from: move.from, to: move.to },
    feedback: puzzle.solutions[0]!.explanation,
  };
}
