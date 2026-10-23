import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { validatePack } from '../../src/services/puzzleValidation.ts';
import { packFixture } from '../fixtures/puzzles.ts';
describe('puzzle pack validation', () => {
  it('accepts a complete legal, mate-verified pack', () =>
    expect(validatePack(packFixture()).puzzles).toHaveLength(1));
  it.each([null, [], {}, 'bad'])('rejects malformed roots %j', (value) =>
    expect(() => validatePack(value)).toThrow(),
  );
  it('rejects structurally invalid FEN', () => {
    const p = packFixture();
    p.puzzles[0]!.fen = 'bad';
    expect(() => validatePack(p)).toThrow(/FEN/i);
  });
  it('rejects missing kings', () => {
    const p = packFixture();
    p.puzzles[0]!.fen = '8/8/8/8/8/8/8/8 w - - 0 1';
    expect(() => validatePack(p)).toThrow(/FEN|king/i);
  });
  it('rejects side-to-move mismatch', () => {
    const p = packFixture();
    p.puzzles[0]!.sideToMove = 'white';
    expect(() => validatePack(p)).toThrow(/side/i);
  });
  it('rejects wrong source exercise numbers', () => {
    const p = packFixture();
    p.puzzles[0]!.source.exercise = 2;
    expect(() => validatePack(p)).toThrow(/exercise/i);
  });
  it('rejects illegal solution moves', () => {
    const p = packFixture();
    p.puzzles[0]!.solutions[0]!.uci = ['d8d1'];
    expect(() => validatePack(p)).toThrow(/legal/i);
  });
  it('rejects legal moves that do not meet mate objective', () => {
    const p = packFixture();
    p.puzzles[0]!.solutions[0] = { uci: ['b8c6'], san: ['Nc6'], explanation: 'Not mate' };
    expect(() => validatePack(p)).toThrow(/mate/i);
  });
  it('rejects an unverified record', () => {
    const p = JSON.parse(JSON.stringify(packFixture()));
    p.puzzles[0].verification.status = 'review';
    expect(() => validatePack(p)).toThrow(/verified/i);
  });
  it('rejects duplicate or out-of-range ids', () => {
    const p = packFixture();
    p.puzzles.push(p.puzzles[0]!);
    expect(() => validatePack(p)).toThrow(/duplicate/i);
    p.puzzles.pop();
    p.puzzles[0]!.id = 21;
    expect(() => validatePack(p)).toThrow(/id/i);
  });
  it('requires accurate SAN notation', () => {
    const p = packFixture();
    p.puzzles[0]!.solutions[0]!.san = ['Qh4'];
    expect(() => validatePack(p)).toThrow(/SAN/i);
  });
  it('rejects positions with the non-moving king already in check', () => {
    const p = packFixture();
    const q = p.puzzles[0]!;
    q.fen = '4k3/8/8/8/8/8/4R3/4K3 w - - 0 1';
    q.sideToMove = 'white';
    expect(() => validatePack(p)).toThrow(/non-moving/i);
  });
  it('rejects book packs without private rights and source evidence', () => {
    const p = packFixture();
    p.collection.kind = 'book';
    expect(() => validatePack(p)).toThrow(/book|rights|hash/i);
  });
  it('rejects solution endings on the opponent turn', () => {
    const p = packFixture();
    p.puzzles[0]!.objective = 'combination';
    p.puzzles[0]!.solutions[0] = {
      uci: ['b8c6', 'b1c3'],
      san: ['Nc6', 'Nc3'],
      explanation: 'Incomplete',
    };
    expect(() => validatePack(p)).toThrow(/odd|player/i);
  });
  it('allows empty book coverage without inventing puzzles', () => {
    const p = packFixture();
    p.puzzles = [];
    expect(validatePack(p).puzzles).toEqual([]);
  });
  it('returns a defensive copy', () => {
    const p = packFixture();
    const v = validatePack(p);
    v.puzzles[0]!.hints.push('new');
    expect(p.puzzles[0]!.hints).not.toContain('new');
  });
  it('does not mistake a draw claim for a verified draw', () => {
    const p = packFixture();
    p.puzzles[0]!.objective = 'draw';
    p.puzzles[0]!.solutions[0] = { uci: ['b8c6'], san: ['Nc6'], explanation: 'Not a draw' };
    expect(() => validatePack(p)).toThrow(/draw/i);
  });
  it('chess library independently recognizes fixture mate', () => {
    const p = packFixture().puzzles[0]!;
    const c = new Chess(p.fen);
    c.move('d8h4');
    expect(c.isCheckmate()).toBe(true);
  });
});
it.each([
  ['4k3/8/8/4P3/8/8/8/4K3 w - d6 0 1', 'e5d6', 'exd6'],
  ['4k3/8/8/8/8/8/P7/4K3 w K - 0 1', 'e1g1', 'O-O'],
])('rejects impossible special rights: %s', (fen, uci, san) => {
  const p = packFixture();
  const q = p.puzzles[0]!;
  q.fen = fen;
  q.sideToMove = 'white';
  q.objective = 'combination';
  q.solutions = [{ uci: [uci], san: [san], explanation: 'Invalid special metadata' }];
  expect(() => validatePack(p)).toThrow(/en passant|castling/i);
});
