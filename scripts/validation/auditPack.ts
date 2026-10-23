import { validatePack } from '../../src/services/puzzleValidation.ts';
import {
  createSession,
  attemptMove,
  revealSolution,
  advanceSolution,
} from '../../src/services/chessEngine.ts';

export function auditPack(value: unknown, requireComplete = false) {
  const pack = validatePack(value);
  if (requireComplete && pack.puzzles.length !== pack.collection.total)
    throw new Error(
      `Incomplete collection: ${pack.puzzles.length}/${pack.collection.total} exercises`,
    );
  let solutions = 0;
  let studies = 0;
  for (const puzzle of pack.puzzles) {
    if (puzzle.objective === 'analysis') studies++;
    for (const line of puzzle.solutions) {
      solutions++;
      const variant = { ...puzzle, solutions: [line] };
      let session = createSession(variant);
      if (puzzle.objective !== 'analysis') {
        for (let turn = 0; session.status === 'playing' && turn < line.uci.length; turn++) {
          const move = line.uci[session.history.length];
          if (!move) break;
          const result = attemptMove(variant, session, move);
          if (result.outcome !== 'continue' && result.outcome !== 'solved')
            throw new Error(`Exercise ${puzzle.id}: engine rejected ${move}`);
          session = result.session;
        }
        if (session.status !== 'solved' || session.history.join(' ') !== line.uci.join(' '))
          throw new Error(`Exercise ${puzzle.id}: solution did not complete`);
      } else if (session.status !== 'revealed') {
        throw new Error(`Exercise ${puzzle.id}: source-error study must start unscored`);
      }
      let playback = revealSolution(variant, createSession(variant));
      for (let ply = 0; ply < line.uci.length; ply++) playback = advanceSolution(variant, playback);
      if (playback.status !== 'revealed' || playback.history.join(' ') !== line.uci.join(' '))
        throw new Error(`Exercise ${puzzle.id}: playback did not reproduce the full line`);
    }
    if (puzzle.objective !== 'analysis') {
      // Also exercise each key with the real shared candidate list and automatic replies.
      for (const key of new Set(puzzle.solutions.map((line) => line.uci[0]!))) {
        let result = attemptMove(puzzle, createSession(puzzle), key);
        for (let ply = 0; result.outcome === 'continue' && ply < 199; ply++) {
          const candidate = puzzle.solutions[result.session.candidates[0]!];
          const move = candidate?.uci[result.session.history.length];
          if (!move) break;
          result = attemptMove(puzzle, result.session, move);
        }
        if (result.outcome !== 'solved')
          throw new Error(`Exercise ${puzzle.id}: key ${key} did not complete`);
      }
    }
  }
  return {
    available: pack.puzzles.length,
    scored: pack.puzzles.length - studies,
    studies,
    solutions,
  };
}
