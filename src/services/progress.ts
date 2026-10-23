export interface PuzzleProgress {
  attempts: number;
  hints: number;
  mistakes: number;
  reveals: number;
  retries: number;
  completed: boolean;
  firstTry: boolean;
}
export interface Progress {
  version: 1;
  collections: Record<string, Record<string, PuzzleProgress>>;
  location: { collection: string; puzzle: number } | null;
}
export const PROGRESS_KEY = 'combinations.progress.v1';
export const emptyProgress = (): Progress => ({ version: 1, collections: {}, location: null });
export const emptyPuzzleProgress = (): PuzzleProgress => ({
  attempts: 0,
  hints: 0,
  mistakes: 0,
  reveals: 0,
  retries: 0,
  completed: false,
  firstTry: false,
});
function count(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1)
      return emptyProgress();
    const root = data as Record<string, unknown>;
    const result = emptyProgress();
    if (
      root.collections &&
      typeof root.collections === 'object' &&
      !Array.isArray(root.collections)
    ) {
      for (const [collection, puzzles] of Object.entries(
        root.collections as Record<string, unknown>,
      )) {
        if (
          !/^[a-z][a-z0-9-]{0,63}$/.test(collection) ||
          !puzzles ||
          typeof puzzles !== 'object' ||
          Array.isArray(puzzles)
        )
          continue;
        const safePuzzles: Record<string, PuzzleProgress> = {};
        for (const [id, entry] of Object.entries(puzzles)) {
          if (!/^\d+$/.test(id) || !entry || typeof entry !== 'object' || Array.isArray(entry))
            continue;
          const p = entry as Record<string, unknown>;
          safePuzzles[id] = {
            attempts: count(p.attempts),
            hints: count(p.hints),
            mistakes: count(p.mistakes),
            reveals: count(p.reveals),
            retries: count(p.retries),
            completed: p.completed === true,
            firstTry: p.completed === true && p.firstTry === true,
          };
        }
        result.collections[collection] = safePuzzles;
      }
    }
    if (root.location && typeof root.location === 'object') {
      const loc = root.location as Record<string, unknown>;
      if (
        typeof loc.collection === 'string' &&
        typeof loc.puzzle === 'number' &&
        Number.isSafeInteger(loc.puzzle) &&
        loc.puzzle > 0
      )
        result.location = { collection: loc.collection, puzzle: loc.puzzle };
    }
    return result;
  } catch {
    return emptyProgress();
  }
}
export function loadProgress(storage: Pick<Storage, 'getItem'>): {
  progress: Progress;
  error: string | null;
} {
  try {
    return { progress: parseProgress(storage.getItem(PROGRESS_KEY)), error: null };
  } catch {
    return {
      progress: emptyProgress(),
      error: 'Browser storage is unavailable. Progress will last for this session.',
    };
  }
}
export function saveProgress(storage: Pick<Storage, 'setItem'>, progress: Progress): string | null {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return null;
  } catch {
    return 'Progress could not be saved. You can continue in this session.';
  }
}
export type ProgressEvent = 'attempt' | 'mistake' | 'hint' | 'reveal' | 'retry' | 'solve';
export function recordProgress(
  progress: Progress,
  collection: string,
  id: number,
  event: ProgressEvent,
): Progress {
  const current = progress.collections[collection]?.[id] ?? emptyPuzzleProgress();
  const next = { ...current };
  if (event === 'attempt') next.attempts++;
  if (event === 'mistake') next.mistakes++;
  if (event === 'hint') next.hints++;
  if (event === 'reveal') next.reveals++;
  if (event === 'retry') next.retries++;
  if (event === 'solve' && !next.completed) {
    next.completed = true;
    next.firstTry =
      next.attempts >= 1 &&
      next.mistakes === 0 &&
      next.hints === 0 &&
      next.reveals === 0 &&
      next.retries === 0;
  }
  return {
    ...progress,
    collections: {
      ...progress.collections,
      [collection]: { ...progress.collections[collection], [id]: next },
    },
  };
}
