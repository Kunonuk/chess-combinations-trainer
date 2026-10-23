import { expect } from 'vitest';
import { parseProgress, PROGRESS_KEY, type Progress } from '../../src/services/progress.ts';

export function readSavedProgress(): Progress {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (raw === null) throw new Error('Expected study progress to be saved in localStorage.');
  const stored: unknown = JSON.parse(raw);
  const progress = parseProgress(raw);
  expect(stored).toEqual(progress);
  return progress;
}
