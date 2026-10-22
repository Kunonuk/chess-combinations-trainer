import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { mateFixture } from '../fixtures/puzzles.ts';
import {
  createSession,
  attemptMove,
  revealSolution,
  advanceSolution,
} from '../../src/services/chessEngine.ts';
import practice from '../../src/data/practice.json';
import { validatePack } from '../../src/services/puzzleValidation.ts';
describe('immutable puzzle sessions', () => {
  it('rejects illegal moves without altering the position', () => {
    const p = mateFixture(),
      s = createSession(p);
    const r = attemptMove(p, s, 'd8d1');
    expect(r.outcome).toBe('illegal');
    expect(r.session.fen).toBe(p.fen);
    expect(s.history).toEqual([]);
  });
  it('rejects a legal incorrect move and keeps original FEN', () => {
    const p = mateFixture(),
      s = createSession(p);
    const r = attemptMove(p, s, 'b8c6');
    expect(r.outcome).toBe('incorrect');
    expect(r.session.fen).toBe(s.fen);
  });
  it('verifies mate and completes only on success', () => {
    const p = mateFixture();
    const r = attemptMove(p, createSession(p), 'd8h4');
    expect(r.outcome).toBe('solved');
    expect(new Chess(r.session.fen).isCheckmate()).toBe(true);
    expect(r.session.san).toEqual(['Qh4#']);
  });
  it('blocks moves after completion', () => {
    const p = mateFixture();
    const r = attemptMove(p, createSession(p), 'd8h4');
    expect(attemptMove(p, r.session, 'a2a3').outcome).toBe('blocked');
  });
  it('plays a verified opponent response and requires the continuation', () => {
    const p = validatePack(practice).puzzles[0]!;
    const first = attemptMove(p, createSession(p), 'a2e6');
    expect(first.outcome).toBe('continue');
    expect(first.session.history).toEqual(['a2e6', 'd7d8']);
    const last = attemptMove(p, first.session, 'f7f8');
    expect(last.outcome).toBe('solved');
    expect(new Chess(last.session.fen).isCheckmate()).toBe(true);
  });
  it('reveals without counting a solve, then plays one ply at a time', () => {
    const p = mateFixture();
    const s = revealSolution(p, createSession(p));
    expect(s.status).toBe('revealed');
    expect(s.fen).toBe(p.fen);
    expect(advanceSolution(p, s).san).toEqual(['Qh4#']);
    expect(advanceSolution(p, s).status).toBe('revealed');
  });
  it('accepts all legal mates in one even outside printed alternative set', () => {
    const p = mateFixture();
    p.fen = '7k/5K2/6Q1/8/8/8/8/8 w - - 0 1';
    p.sideToMove = 'white';
    p.solutions = [{ uci: ['g6g7'], san: ['Qg7#'], explanation: 'Rules fixture' }];
    expect(attemptMove(p, createSession(p), 'g6g7').outcome).toBe('solved');
    expect(attemptMove(p, createSession(p), 'g6g8').outcome).toBe('solved');
  });
  it.each([
    ['4k3/8/8/8/8/8/8/4K2R w K - 0 1', 'e1g1', 'O-O'],
    ['4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1', 'e5d6', 'exd6'],
    ['7k/P7/8/8/8/8/8/4K3 w - - 0 1', 'a7a8n', 'a8=N'],
  ])('handles special move %s %s', (fen, uci, san) => {
    const p = mateFixture();
    p.fen = fen;
    p.sideToMove = 'white';
    p.objective = 'combination';
    p.solutions = [{ uci: [uci], san: [san], explanation: 'Rules fixture' }];
    expect(attemptMove(p, createSession(p), uci).outcome).toBe('solved');
  });
});
