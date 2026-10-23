import { useEffect, useRef, useState } from 'react';
import { saveProgress, type Progress } from '../services/progress.ts';

export type SaveNotice = 'report' | 'preserve';

export function useStudyProgress(
  initialProgress: Progress,
  onSaveError: (message: string) => void,
) {
  const [{ progress, saveNotice }, setState] = useState({
    progress: initialProgress,
    saveNotice: 'report' as SaveNotice,
  });
  const persisted = useRef(initialProgress);

  function updateProgress(
    update: (previous: Progress) => Progress,
    saveNotice: SaveNotice = 'report',
  ): void {
    setState((previous) => ({ progress: update(previous.progress), saveNotice }));
  }

  useEffect(() => {
    // Persist committed snapshots once, including when StrictMode replays effects.
    if (persisted.current === progress) return;
    persisted.current = progress;
    let error: string | null;
    try {
      error = saveProgress(window.localStorage, progress);
    } catch {
      error = 'Progress could not be saved. You can continue in this session.';
    }
    // Import results already explain whether the imported pack could be retained.
    if (error && saveNotice === 'report') onSaveError(error);
  }, [progress, saveNotice, onSaveError]);

  return { progress, updateProgress };
}
