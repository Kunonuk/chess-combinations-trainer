import { describe, expect, it } from 'vitest';
import { auditPack } from '../../scripts/validation/auditPack.ts';
import { analysisFixture, drawFixture, packFixture } from '../fixtures/puzzles.ts';
import bookData from '../../src/data/book.json';

describe('complete collection audit', () => {
  it('checks every scored variant and every unscored playback line', () => {
    const pack = packFixture();
    pack.puzzles.push(analysisFixture());
    pack.collection.total = 2;
    expect(auditPack(pack, true)).toEqual({ available: 2, scored: 1, studies: 1, solutions: 2 });
  });
  it('rejects missing original exercise numbers when completeness is required', () => {
    expect(() => auditPack(packFixture(), true)).toThrow(/incomplete/i);
  });
  it.each(['white', 'black'] as const)(
    'checks a terminal draw completed on the %s opponent reply',
    (side) => {
      const pack = packFixture();
      pack.puzzles = [drawFixture(side)];
      pack.collection.total = 1;
      expect(auditPack(pack, true)).toEqual({ available: 1, scored: 1, studies: 0, solutions: 1 });
    },
  );
  it('audits all 719 shipped exercises and all their solution/playback lines', () => {
    expect(auditPack(bookData, true)).toEqual({
      available: 719,
      scored: 718,
      studies: 1,
      solutions: 792,
    });
  }, 20000);
});

it.each([
  { id: 247, san: ['Qg3+', 'Kxg3'] },
  { id: 258, san: ['Ndc6+', 'bxc6', 'Nxc6+', 'Ke8', 'Nxa5'] },
  { id: 261, san: ['Rxg2+', 'Kxg2'] },
])('retains the printed drawing alternative for exercise $id', ({ id, san }) => {
  expect(
    bookData.puzzles
      .find((puzzle) => puzzle.id === id)!
      .solutions.some((line) => JSON.stringify(line.san) === JSON.stringify(san)),
  ).toBe(true);
});
