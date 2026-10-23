import { Chess, validateFen, type Square } from 'chess.js';
import type { Puzzle, PuzzlePack, Solution } from '../types/puzzle.ts';

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`${label}: expected object`);
  return value as Record<string, unknown>;
}
function text(value: unknown, label: string, limit = 2000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > limit)
    throw new Error(`${label}: expected non-empty text`);
  return value;
}
function integer(value: unknown, label: string, max = 10000): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1 || value > max)
    throw new Error(`${label}: invalid positive integer`);
  return value;
}
function array(value: unknown, label: string, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error(`${label}: invalid array`);
  return value;
}
function choice<T extends string>(value: unknown, choices: readonly T[], label: string): T {
  if (typeof value !== 'string' || !choices.includes(value as T))
    throw new Error(`${label}: unsupported value`);
  return value as T;
}
function position(fen: string): Chess {
  const result = validateFen(fen);
  if (!result.ok) throw new Error(`FEN: ${result.error}`);
  const chess = new Chess(fen);
  const pieces = chess
    .board()
    .flat()
    .filter((p) => p !== null);
  for (const color of ['w', 'b'] as const) {
    if (
      pieces.filter((p) => p.color === color).length > 16 ||
      pieces.filter((p) => p.color === color && p.type === 'p').length > 8
    )
      throw new Error('FEN: too many pieces');
  }
  const fields = fen.split(' ');
  const rights = fields[2]!;
  for (const [right, king, rook, color] of [
    ['K', 'e1', 'h1', 'w'],
    ['Q', 'e1', 'a1', 'w'],
    ['k', 'e8', 'h8', 'b'],
    ['q', 'e8', 'a8', 'b'],
  ] as const) {
    if (
      rights.includes(right) &&
      (chess.get(king)?.type !== 'k' ||
        chess.get(king)?.color !== color ||
        chess.get(rook)?.type !== 'r' ||
        chess.get(rook)?.color !== color)
    )
      throw new Error('FEN: impossible castling rights');
  }
  if (fields[3] !== '-') {
    const ep = fields[3]!;
    const pawnSquare = (ep[0] + (chess.turn() === 'w' ? '5' : '4')) as Square;
    const origin = (ep[0] + (chess.turn() === 'w' ? '7' : '2')) as Square;
    const pawn = chess.get(pawnSquare);
    if (
      chess.get(ep as Square) ||
      chess.get(origin) ||
      pawn?.type !== 'p' ||
      pawn.color === chess.turn()
    )
      throw new Error('FEN: impossible en passant target');
  }

  fields[1] = chess.turn() === 'w' ? 'b' : 'w';
  fields[3] = '-';
  if (new Chess(fields.join(' ')).isCheck())
    throw new Error('FEN: non-moving king is already in check');
  if (chess.isGameOver()) throw new Error('FEN: puzzle starts in a terminal position');
  return chess;
}
function solution(value: unknown, puzzle: Pick<Puzzle, 'fen' | 'objective'>): Solution {
  const s = object(value, 'solution');
  const uci = array(s.uci, 'UCI line', 199).map((m) => text(m, 'UCI', 5));
  const san = array(s.san, 'SAN line', 199).map((m) => text(m, 'SAN', 20));
  if (!uci.length || uci.length % 2 !== 1)
    throw new Error('Solution must have odd plies and end on the player move');
  if (uci.length !== san.length) throw new Error('SAN and UCI lengths differ');
  const chess = new Chess(puzzle.fen);
  for (let i = 0; i < uci.length; i++) {
    const move = uci[i]!;
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) throw new Error('Illegal UCI notation');
    let actual;
    try {
      actual = chess.move(move);
    } catch {
      throw new Error(`Illegal solution move ${move}`);
    }
    if (actual.san !== san[i])
      throw new Error(`SAN mismatch at ply ${i + 1}: expected ${actual.san}`);
  }
  if (puzzle.objective === 'mate-in-1' && uci.length !== 1)
    throw new Error('Mate in one must have one ply');
  if (
    (puzzle.objective === 'mate-in-1' || puzzle.objective === 'checkmate') &&
    !chess.isCheckmate()
  )
    throw new Error('Solution does not produce checkmate');
  if (puzzle.objective === 'draw' && !chess.isDraw())
    throw new Error('Solution does not produce a verifiable draw');
  return { uci, san, explanation: text(s.explanation, 'explanation') };
}

export function validatePack(value: unknown): PuzzlePack {
  const root = object(value, 'pack');
  if (root.schemaVersion !== 1) throw new Error('Unsupported schema version');
  const c = object(root.collection, 'collection');
  const id = text(c.id, 'collection id', 64);
  if (!/^[a-z][a-z0-9-]+$/.test(id)) throw new Error('Invalid collection id');
  const collection: PuzzlePack['collection'] = {
    id,
    title: text(c.title, 'collection title', 200),
    kind: choice(c.kind, ['book', 'practice'], 'collection kind'),
    total: integer(c.total, 'collection total'),
    license: choice(c.license, ['CC0', 'private-use-only', 'permission-granted'], 'rights'),
  };
  if (c.sourceHash !== undefined) {
    collection.sourceHash = text(c.sourceHash, 'source hash', 64);
    if (!/^[a-f0-9]{64}$/.test(collection.sourceHash)) throw new Error('Invalid source hash');
  }
  if (collection.kind === 'book' && (!collection.sourceHash || collection.license === 'CC0'))
    throw new Error('Book requires source hash and explicit book rights');
  const seen = new Set<number>();
  const puzzles = array(root.puzzles, 'puzzles', 10000).map((value): Puzzle => {
    const p = object(value, 'puzzle');
    const id = integer(p.id, 'puzzle id', collection.total);
    if (seen.has(id)) throw new Error(`Duplicate puzzle id ${id}`);
    seen.add(id);
    const fen = text(p.fen, 'FEN', 120);
    const chess = position(fen);
    const sideToMove = choice(p.sideToMove, ['white', 'black'], 'side to move');
    if ((chess.turn() === 'w' ? 'white' : 'black') !== sideToMove)
      throw new Error('Side to move mismatches FEN');
    const objective = choice(
      p.objective,
      ['mate-in-1', 'checkmate', 'combination', 'draw'],
      'objective',
    );
    const v = object(p.verification, 'verification');
    if (v.status !== 'verified') throw new Error(`Exercise ${id} is not verified`);
    const s = object(p.source, 'source');
    if (s.exercise !== id) throw new Error('Source exercise number mismatch');
    const source: Puzzle['source'] = { book: text(s.book, 'source book', 200), exercise: id };
    if (s.page !== undefined) source.page = integer(s.page, 'source page');
    if (s.solutionPage !== undefined)
      source.solutionPage = integer(s.solutionPage, 'solution page');
    if (s.url !== undefined) {
      source.url = text(s.url, 'source URL', 1000);
      if (!/^https:\/\//.test(source.url)) throw new Error('Source URL must use HTTPS');
    }
    if (collection.kind === 'book' && (!source.page || !source.solutionPage))
      throw new Error('Book requires diagram and solution page references');
    if (collection.kind === 'practice' && !source.url)
      throw new Error('Practice source URL required');
    const solutions = array(p.solutions, 'solutions', 64).map((s) =>
      solution(s, { fen, objective }),
    );
    if (!solutions.length) throw new Error('At least one verified solution required');
    return {
      id,
      stage: integer(p.stage, 'stage', 9),
      chapter: text(p.chapter, 'chapter', 200),
      description: text(p.description, 'description'),
      fen,
      sideToMove,
      objective,
      solutions,
      hints: array(p.hints, 'hints', 10).map((h) => text(h, 'hint')),
      source,
      verification: {
        status: 'verified',
        method: text(v.method, 'verification method'),
        reviewer: text(v.reviewer, 'reviewer'),
        evidence: text(v.evidence, 'verification evidence', 10000),
      },
    };
  });
  return { schemaVersion: 1, collection, puzzles: puzzles.sort((a, b) => a.id - b.id) };
}
