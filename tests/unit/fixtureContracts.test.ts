import { describe, expect, it } from 'vitest';
import { bookPackFixture } from '../fixtures/bookPack.ts';
import { fixturePuzzle, packFixture } from '../fixtures/puzzles.ts';

describe('mutable fixture puzzle access', () => {
  it('returns the first puzzle by default without copying it', () => {
    const pack = packFixture();
    expect(fixturePuzzle(pack)).toBe(pack.puzzles[0]);
  });

  it('returns the requested puzzle from a multi-puzzle fixture', () => {
    const pack = bookPackFixture();
    expect(fixturePuzzle(pack, 1)).toBe(pack.puzzles[1]);
    expect(fixturePuzzle(pack, 1).source.exercise).toBe(3);
  });

  it('reports the collection and index when a test deliberately empties a fixture', () => {
    const pack = packFixture();
    pack.puzzles = [];
    expect(() => fixturePuzzle(pack)).toThrow('Fixture "test-fixtures" has no puzzle at index 0.');
  });

  it('reports the collection and index for an out-of-range access', () => {
    expect(() => fixturePuzzle(bookPackFixture(), 2)).toThrow(
      'Fixture "ivashchenko-1a" has no puzzle at index 2.',
    );
  });

  it('keeps puzzle mutations local to each factory call', () => {
    const original = packFixture();
    const changed = packFixture();
    fixturePuzzle(changed).source.exercise = 42;
    fixturePuzzle(changed).hints.push('Only in the changed fixture');
    expect(fixturePuzzle(original).source.exercise).toBe(1);
    expect(fixturePuzzle(original).hints).not.toContain('Only in the changed fixture');
  });
});
