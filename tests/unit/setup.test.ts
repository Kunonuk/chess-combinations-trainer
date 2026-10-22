import { expect, it } from 'vitest';
import { Chess } from 'chess.js';
it('uses a legal chess rules engine', () => {
  const chess = new Chess();
  expect(chess.moves()).toHaveLength(20);
  expect(chess.move('e4').san).toBe('e4');
});
