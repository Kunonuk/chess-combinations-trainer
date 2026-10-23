import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js';
import { drawFixture, packFixture, repetitionFixture } from '../fixtures/puzzles.ts';
import { validatePack } from '../../src/services/puzzleValidation.ts';
import {
  attemptMove,
  createSession,
  revealSolution,
  advanceSolution,
} from '../../src/services/chessEngine.ts';

describe('draws completed by the opponent reply', () => {
  it.each(['white', 'black'] as const)('admits a verified terminal draw for %s', (side) => {
    const pack = packFixture();
    pack.puzzles = [drawFixture(side)];
    expect(validatePack(pack).puzzles[0]!.solutions[0]!.uci).toHaveLength(2);
  });
  it.each(['white', 'black'] as const)('completes %s after the automatic capture', (side) => {
    const puzzle = drawFixture(side);
    const original = createSession(puzzle);
    const result = attemptMove(puzzle, original, puzzle.solutions[0]!.uci[0]!);
    expect(result.outcome).toBe('solved');
    expect(result.session.status).toBe('solved');
    expect(result.session.history).toEqual(puzzle.solutions[0]!.uci);
    expect(new Chess(result.session.fen).isStalemate()).toBe(true);
    expect(result.session.feedback).toBe('Correct! Draw.');
    expect(attemptMove(puzzle, result.session, 'a1a2').outcome).toBe('blocked');
    expect(original.history).toEqual([]);
    expect(original.fen).toBe(puzzle.fen);
  });
  it('rejects an even line that does not reach a draw', () => {
    const pack = packFixture();
    const puzzle = drawFixture();
    puzzle.solutions = [
      { uci: ['b2b3', 'c3d4'], san: ['Rb3+', 'Kd4'], explanation: 'Not a draw.' },
    ];
    pack.puzzles = [puzzle];
    expect(() => validatePack(pack)).toThrow(/draw/i);
  });
  it('reveals the complete draw without counting it as solved', () => {
    const puzzle = drawFixture();
    let session = revealSolution(puzzle, createSession(puzzle));
    session = advanceSolution(puzzle, session);
    expect(new Chess(session.fen).isStalemate()).toBe(false);
    session = advanceSolution(puzzle, session);
    expect(new Chess(session.fen).isStalemate()).toBe(true);
    expect(session.status).toBe('revealed');
  });
});

describe('history-dependent and terminal draws', () => {
  it.each(['white', 'black'] as const)(
    'finishes a %s repetition draw after the automatic reply',
    (side) => {
      const pack = packFixture();
      pack.puzzles = [repetitionFixture(side)];
      const puzzle = validatePack(pack).puzzles[0]!;
      let result = {
        session: createSession(puzzle),
        outcome: 'continue' as ReturnType<typeof attemptMove>['outcome'],
      };
      for (let ply = 0; ply < 8; ply += 2) {
        result = attemptMove(puzzle, result.session, puzzle.solutions[0]!.uci[ply]!);
        if (ply < 6) expect(result.outcome).toBe('continue');
      }
      expect(result.outcome).toBe('solved');
      expect(result.session.feedback).toBe('Correct! Draw.');
      expect(result.session.history).toEqual(puzzle.solutions[0]!.uci);
      expect(attemptMove(puzzle, result.session, puzzle.solutions[0]!.uci[0]!).outcome).toBe(
        'blocked',
      );
    },
  );
  it.each([3, 4])('rejects a %i-ply line continuing after an earlier terminal draw', (plies) => {
    const puzzle = drawFixture();
    puzzle.fen = '7k/8/8/8/8/8/3n4/K1B5 w - - 0 1';
    puzzle.solutions = [
      {
        uci: ['c1d2', 'h8g8', 'd2e3', 'g8f8'].slice(0, plies),
        san: ['Bxd2', 'Kg8', 'Be3', 'Kf8'].slice(0, plies),
        explanation: 'The first capture already leaves insufficient material.',
      },
    ];
    const pack = packFixture();
    pack.puzzles = [puzzle];
    expect(() => validatePack(pack)).toThrow(/continues after.*terminal/i);
  });
});
