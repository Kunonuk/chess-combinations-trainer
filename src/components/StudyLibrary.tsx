import { bookInfo } from '../data/catalogue.ts';
import type { Progress } from '../services/progress.ts';
import type { Puzzle, PuzzlePack } from '../types/puzzle.ts';

interface StudyLibraryProps {
  packs: readonly PuzzlePack[];
  pack: PuzzlePack | undefined;
  puzzle: Puzzle | undefined;
  progress: Progress;
  onNavigate: (pack: PuzzlePack, id: number) => void;
  onImport: (file: File) => Promise<void>;
  onReset: () => void;
}

export function StudyLibrary({
  packs,
  pack,
  puzzle,
  progress,
  onNavigate,
  onImport,
  onReset,
}: StudyLibraryProps) {
  const bookPack = packs.find((pack) => pack.collection.kind === 'book');
  const bookCount = bookPack?.puzzles.length ?? 0;
  const scoredCount = pack?.puzzles.filter((puzzle) => puzzle.objective !== 'analysis').length ?? 0;
  const completed =
    pack?.puzzles.filter(
      (puzzle) =>
        puzzle.objective !== 'analysis' &&
        progress.collections[pack.collection.id]?.[puzzle.id]?.completed,
    ).length ?? 0;
  return (
    <aside className="study-sidebar" aria-label="Study library">
      <div className="sidebar-heading">
        <span className="eyebrow">YOUR PRACTICE</span>
        <span className="tiny-mark">01 / STUDY</span>
      </div>
      <h2>The collection</h2>
      {pack && (
        <>
          <label className="field-label" htmlFor="collection">
            Collection
          </label>
          <select
            id="collection"
            data-testid="collection-select"
            value={pack.collection.id}
            onChange={(e) => {
              const next = packs.find((p) => p.collection.id === e.target.value);
              if (next?.puzzles[0]) onNavigate(next, next.puzzles[0].id);
            }}
          >
            {packs
              .filter((p) => p.puzzles.length)
              .map((p) => (
                <option key={p.collection.id} value={p.collection.id}>
                  {p.collection.kind === 'practice'
                    ? 'Lichess practice · separate collection'
                    : p.collection.title}
                </option>
              ))}
          </select>
          <div className={`source-card ${pack.collection.kind}`}>
            <strong>
              {pack.collection.kind === 'book'
                ? 'Private book collection'
                : 'Separate Lichess practice'}
            </strong>
            <p>
              {pack.collection.kind === 'book'
                ? `${pack.puzzles.length} of ${bookInfo.total} book exercises available.`
                : 'These CC0 puzzles are independent practice exercises. They are not exercises from the book.'}
            </p>
            <span className="source-dot" />{' '}
            {pack.collection.kind === 'book'
              ? 'Reviewed diagrams and checked training lines'
              : 'Attributed CC0 source'}
          </div>
          {puzzle && (
            <>
              <label className="field-label" htmlFor="chapter">
                Stage & chapter
              </label>
              <select
                id="chapter"
                data-testid="chapter-select"
                value={`${puzzle.stage}|${puzzle.chapter}`}
                onChange={(e) => {
                  const next = pack.puzzles.find(
                    (p) => `${p.stage}|${p.chapter}` === e.target.value,
                  );
                  if (next) onNavigate(pack, next.id);
                }}
              >
                {Array.from(new Set(pack.puzzles.map((p) => `${p.stage}|${p.chapter}`))).map(
                  (key) => {
                    const [stage, chapter] = key.split('|');
                    return (
                      <option key={key} value={key}>
                        Stage {stage} · {chapter}
                      </option>
                    );
                  },
                )}
              </select>
              <label className="field-label" htmlFor="exercise">
                Exercise
              </label>
              <select
                id="exercise"
                data-testid="exercise-select"
                value={puzzle.id}
                onChange={(e) => onNavigate(pack, Number(e.target.value))}
              >
                {Array.from({ length: pack.collection.total }, (_, i) => i + 1).map((id) => {
                  const exercise = pack.puzzles.find((p) => p.id === id);
                  return (
                    <option
                      data-testid={`exercise-option-${id}`}
                      key={id}
                      value={id}
                      disabled={!exercise}
                    >
                      #{id}
                      {exercise
                        ? exercise.objective === 'analysis'
                          ? ' · source note'
                          : progress.collections[pack.collection.id]?.[id]?.completed
                            ? ' · completed'
                            : ''
                        : ' · unavailable'}
                    </option>
                  );
                })}
              </select>
            </>
          )}
          <div className="progress-card">
            <div>
              <strong>{completed}</strong>
              <span> / {scoredCount} available solved</span>
            </div>
            <progress
              data-testid="collection-progress"
              value={completed}
              max={Math.max(1, scoredCount)}
              aria-label="Collection progress"
            />
            <div className="chapter-progress">
              {Array.from(new Set(pack.puzzles.map((p) => `${p.stage}|${p.chapter}`))).map(
                (key) => {
                  const rows = pack.puzzles.filter((p) => `${p.stage}|${p.chapter}` === key);
                  const scored = rows.filter((p) => p.objective !== 'analysis');
                  const done = scored.filter(
                    (p) => progress.collections[pack.collection.id]?.[p.id]?.completed,
                  ).length;
                  return (
                    <div key={key}>
                      <span>
                        Stage {rows[0]?.stage} · {rows[0]?.chapter}
                      </span>
                      <b>{scored.length ? `${done}/${scored.length}` : 'Study only'}</b>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </>
      )}
      <details className="book-coverage">
        <summary>
          Book coverage <span>{bookCount} / 719</span>
        </summary>
        <p>
          Available positions can be opened. Source errors are marked as unscored studies.
          Unavailable exercises stay visible in the catalogue.
        </p>
        <label className="field-label" htmlFor="book-catalogue">
          All 719 book exercises
        </label>
        <select
          id="book-catalogue"
          data-testid="book-catalogue"
          value={pack?.collection.kind === 'book' ? (puzzle?.id ?? '') : ''}
          onChange={(e) => {
            if (bookPack) onNavigate(bookPack, Number(e.target.value));
          }}
        >
          <option value="" disabled>
            Choose an available exercise
          </option>
          {Array.from({ length: 719 }, (_, i) => i + 1).map((id) => (
            <option
              data-testid={`book-exercise-${id}`}
              key={id}
              value={id}
              disabled={!bookPack?.puzzles.some((p) => p.id === id)}
            >
              #{id}
              {bookPack?.puzzles.some((p) => p.id === id) ? '' : ' · unavailable'}
            </option>
          ))}
        </select>
      </details>
      <label className="import-button">
        Import verified private pack
        <input
          data-testid="import-pack"
          aria-label="Import verified private pack"
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) void onImport(file);
          }}
        />
      </label>
      <p className="privacy-note">Your study history stays in this browser.</p>
      <button
        data-testid="reset-progress"
        className="text-button reset-button"
        onClick={() => onReset()}
      >
        Reset study progress
      </button>
    </aside>
  );
}
