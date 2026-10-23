import { useEffect, useState, type ChangeEvent } from 'react';
import { Chess, type Square } from 'chess.js';
import { ChessBoard } from './components/ChessBoard.tsx';
import { bundledPacks, bookInfo } from './data/catalogue.ts';
import {
  createSession,
  attemptMove,
  revealSolution,
  advanceSolution,
} from './services/chessEngine.ts';
import { validatePack } from './services/puzzleValidation.ts';
import {
  emptyProgress,
  emptyPuzzleProgress,
  loadProgress,
  recordProgress,
  saveProgress,
  type Progress,
  type ProgressEvent,
  type PuzzleProgress,
} from './services/progress.ts';
import type { Puzzle, PuzzlePack } from './types/puzzle.ts';
import './App.css';

const IMPORT_KEY = 'combinations.private-pack.v1';
const APPEARANCE_KEY = 'combinations.appearance.v1';
function readAppearance() {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(APPEARANCE_KEY) ?? 'null');
    const object = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
    return {
      dark: object.dark === true,
      boardTheme: object.boardTheme === 'walnut' ? 'walnut' : 'forest',
    };
  } catch {
    return { dark: false, boardTheme: 'forest' };
  }
}

function validateBookPack(value: unknown): PuzzlePack {
  const pack = validatePack(value);
  if (
    pack.collection.id !== bookInfo.id ||
    pack.collection.kind !== 'book' ||
    pack.collection.sourceHash !== bookInfo.sourceHash ||
    pack.collection.total !== bookInfo.total
  )
    throw new Error('This is not a verified pack for this edition of the book.');
  if (!pack.puzzles.length) throw new Error('The pack has no available exercises.');
  return pack;
}
function safeSave(progress: Progress): string | null {
  try {
    return saveProgress(window.localStorage, progress);
  } catch {
    return 'Progress could not be saved. You can continue in this session.';
  }
}
function initialState(): { progress: Progress; imported: PuzzlePack | null; error: string | null } {
  try {
    const loaded = loadProgress(window.localStorage);
    const raw = window.localStorage.getItem(IMPORT_KEY);
    let imported = null;
    if (raw && raw.length <= 5 * 1024 * 1024) {
      try {
        imported = validateBookPack(JSON.parse(raw));
      } catch {
        /* Invalid stored packs never enter the catalogue. */
      }
    }
    return { ...loaded, imported };
  } catch {
    return {
      progress: emptyProgress(),
      imported: null,
      error: 'Browser storage is unavailable. Progress will last for this session.',
    };
  }
}
export default function App() {
  const [initial] = useState(initialState);
  const [progress, setProgress] = useState(initial.progress);
  const [imported, setImported] = useState<PuzzlePack | null>(initial.imported);
  const [notice, setNotice] = useState<string | null>(initial.error);
  const [appearance] = useState(readAppearance);
  const [dark, setDark] = useState(appearance.dark);
  const [boardTheme, setBoardTheme] = useState(appearance.boardTheme);
  useEffect(() => {
    try {
      window.localStorage.setItem(APPEARANCE_KEY, JSON.stringify({ dark, boardTheme }));
    } catch {
      /* Appearance still works when persistence is unavailable. */
    }
  }, [dark, boardTheme]);
  const [resetOpen, setResetOpen] = useState(false);
  const [studyRevision, setStudyRevision] = useState(0);
  const packs = imported
    ? [imported, ...bundledPacks.filter((p) => p.collection.id !== imported.collection.id)]
    : bundledPacks;
  const firstPack =
    packs.find((p) => p.collection.kind === 'book' && p.puzzles.length) ??
    packs.find((p) => p.puzzles.length);
  const [location, setLocation] = useState(
    () =>
      initial.progress.location ?? {
        collection: firstPack?.collection.id ?? '',
        puzzle: firstPack?.puzzles[0]?.id ?? 1,
      },
  );
  const pack =
    packs.find((p) => p.collection.id === location.collection && p.puzzles.length) ?? firstPack;
  const puzzle = pack?.puzzles.find((p) => p.id === location.puzzle) ?? pack?.puzzles[0];
  const bookPack = packs.find((p) => p.collection.kind === 'book');
  const bookCount = bookPack?.puzzles.length ?? 0;
  function persist(next: Progress) {
    setProgress(next);
    const error = safeSave(next);
    if (error) setNotice(error);
  }
  function navigate(nextPack: PuzzlePack, id: number) {
    const nextLocation = { collection: nextPack.collection.id, puzzle: id };
    setLocation(nextLocation);
    persist({ ...progress, location: nextLocation });
  }
  function record(event: ProgressEvent) {
    if (!pack || !puzzle) return;
    setProgress((previous) => {
      const next = recordProgress(previous, pack.collection.id, puzzle.id, event);
      const error = safeSave(next);
      if (error) setNotice(error);
      return next;
    });
  }
  async function importPack(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setNotice('Choose a JSON pack smaller than 5 MB.');
      return;
    }
    try {
      const raw = await file.text();
      const next = validateBookPack(JSON.parse(raw));
      setImported(next);
      setStudyRevision((revision) => revision + 1);
      navigate(next, next.puzzles[0]!.id);
      try {
        window.localStorage.setItem(IMPORT_KEY, raw);
        setNotice(
          `Imported ${next.puzzles.length} verified book exercises. The pack stays in this browser.`,
        );
      } catch {
        setNotice('Pack imported for this session. Browser storage could not retain it.');
      }
    } catch (error) {
      setNotice(
        `Pack was not imported: ${error instanceof Error ? error.message : 'Invalid JSON'}`,
      );
    }
  }
  const currentProgress =
    pack && puzzle
      ? (progress.collections[pack.collection.id]?.[puzzle.id] ?? emptyPuzzleProgress())
      : emptyPuzzleProgress();
  const completed =
    pack?.puzzles.filter((p) => progress.collections[pack.collection.id]?.[p.id]?.completed)
      .length ?? 0;
  return (
    <div className={`app ${dark ? 'dark' : ''} board-theme-${boardTheme}`}>
      <header className="site-header">
        <a className="wordmark" href="#main">
          <span aria-hidden="true">♞</span> COMBINATIONS <small>THE STUDY ROOM</small>
        </a>
        <div className="header-actions">
          <label className="theme-label">
            Board{' '}
            <select
              aria-label="Board theme"
              value={boardTheme}
              onChange={(e) => setBoardTheme(e.target.value)}
            >
              <option value="forest">Forest</option>
              <option value="walnut">Walnut</option>
            </select>
          </label>
          <button
            className="icon-button"
            onClick={() => setDark(!dark)}
            aria-label={dark ? 'Use light appearance' : 'Use dark appearance'}
          >
            {dark ? '☀' : '☾'}
          </button>
        </div>
      </header>
      <main id="main" className="study-layout">
        <section className="study-main">
          <div className="eyebrow">A LITTLE PRACTICE. A CLEARER MIND.</div>
          <h1>Find the beautiful move.</h1>
          <p className="intro">Take your time. See the whole board. Make every move count.</p>
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button aria-label="Dismiss notice" onClick={() => setNotice(null)}>
                ×
              </button>
            </div>
          )}
          {pack && puzzle ? (
            <Study
              key={`${pack.collection.id}:${puzzle.id}:${studyRevision}`}
              puzzle={puzzle}
              progress={currentProgress}
              record={record}
              index={pack.puzzles.indexOf(puzzle)}
              total={pack.puzzles.length}
              onPrevious={() => {
                const p = pack.puzzles[pack.puzzles.indexOf(puzzle) - 1];
                if (p) navigate(pack, p.id);
              }}
              onNext={() => {
                const p = pack.puzzles[pack.puzzles.indexOf(puzzle) + 1];
                if (p) navigate(pack, p.id);
              }}
            />
          ) : (
            <p role="alert">
              No verified exercises are available. Import a verified book pack to begin.
            </p>
          )}
        </section>
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
                value={pack.collection.id}
                onChange={(e) => {
                  const next = packs.find((p) => p.collection.id === e.target.value);
                  if (next?.puzzles[0]) navigate(next, next.puzzles[0].id);
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
                    ? `${pack.puzzles.length} of ${bookInfo.total} book exercises verified and available.`
                    : 'These CC0 puzzles are independent practice exercises. They are not exercises from the book.'}
                </p>
                <span className="source-dot" />{' '}
                {pack.collection.kind === 'book'
                  ? 'Verified against printed solutions'
                  : 'Attributed CC0 source'}
              </div>
              {puzzle && (
                <>
                  <label className="field-label" htmlFor="chapter">
                    Stage & chapter
                  </label>
                  <select
                    id="chapter"
                    value={`${puzzle.stage}|${puzzle.chapter}`}
                    onChange={(e) => {
                      const next = pack.puzzles.find(
                        (p) => `${p.stage}|${p.chapter}` === e.target.value,
                      );
                      if (next) navigate(pack, next.id);
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
                    value={puzzle.id}
                    onChange={(e) => navigate(pack, Number(e.target.value))}
                  >
                    {Array.from({ length: pack.collection.total }, (_, i) => i + 1).map((id) => {
                      const exists = pack.puzzles.some((p) => p.id === id);
                      return (
                        <option key={id} value={id} disabled={!exists}>
                          #{id}
                          {exists
                            ? progress.collections[pack.collection.id]?.[id]?.completed
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
                  <span> / {pack.puzzles.length} available solved</span>
                </div>
                <progress
                  value={completed}
                  max={Math.max(1, pack.puzzles.length)}
                  aria-label="Collection progress"
                />
                <div className="chapter-progress">
                  {Array.from(new Set(pack.puzzles.map((p) => `${p.stage}|${p.chapter}`))).map(
                    (key) => {
                      const rows = pack.puzzles.filter((p) => `${p.stage}|${p.chapter}` === key);
                      const done = rows.filter(
                        (p) => progress.collections[pack.collection.id]?.[p.id]?.completed,
                      ).length;
                      return (
                        <div key={key}>
                          <span>
                            Stage {rows[0]?.stage} · {rows[0]?.chapter}
                          </span>
                          <b>
                            {done}/{rows.length}
                          </b>
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
              Only verified positions can be opened. Unavailable exercises stay visible in the
              catalogue.
            </p>
            <label className="field-label" htmlFor="book-catalogue">
              All 719 book exercises
            </label>
            <select
              id="book-catalogue"
              value={pack?.collection.kind === 'book' ? (puzzle?.id ?? '') : ''}
              onChange={(e) => {
                if (bookPack) navigate(bookPack, Number(e.target.value));
              }}
            >
              <option value="" disabled>
                Choose an available exercise
              </option>
              {Array.from({ length: 719 }, (_, i) => i + 1).map((id) => (
                <option key={id} value={id} disabled={!bookPack?.puzzles.some((p) => p.id === id)}>
                  #{id}
                  {bookPack?.puzzles.some((p) => p.id === id) ? '' : ' · unavailable'}
                </option>
              ))}
            </select>
          </details>
          <label className="import-button">
            Import verified private pack
            <input
              aria-label="Import verified private pack"
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                void importPack(e);
              }}
            />
          </label>
          <p className="privacy-note">Your study history stays in this browser.</p>
          <button className="text-button reset-button" onClick={() => setResetOpen(true)}>
            Reset study progress
          </button>
        </aside>
      </main>
      <footer>
        Study slowly. Remember deeply.<span>COMBINATIONS · A PERSONAL CHESS PRACTICE</span>
      </footer>
      {resetOpen && (
        <div className="modal-backdrop">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <h2 id="reset-title">Reset all study progress?</h2>
            <p>
              This removes attempts, hints, and completed history for every collection in this
              browser.
            </p>
            <div className="dialog-actions">
              <button onClick={() => setResetOpen(false)} autoFocus>
                Keep progress
              </button>
              <button
                className="danger-button"
                onClick={() => {
                  persist({ ...emptyProgress(), location: progress.location });
                  setStudyRevision((revision) => revision + 1);
                  setResetOpen(false);
                }}
              >
                Reset progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StudyProps {
  puzzle: Puzzle;
  progress: PuzzleProgress;
  record: (event: ProgressEvent) => void;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}
function Study({ puzzle, progress, record, index, total, onPrevious, onNext }: StudyProps) {
  const [session, setSession] = useState(() => createSession(puzzle));
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [hintLevel, setHintLevel] = useState(0);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  function submit(uci: string) {
    const result = attemptMove(puzzle, session, uci);
    record('attempt');
    if (result.outcome === 'incorrect' || result.outcome === 'illegal') record('mistake');
    if (result.outcome === 'solved') record('solve');
    setSession(result.session);
  }
  function move(from: Square, to: Square) {
    const piece = new Chess(session.fen).get(from);
    if (piece?.type === 'p' && (to[1] === '1' || to[1] === '8')) {
      setPromotion({ from, to });
      return;
    }
    submit(from + to);
  }
  const candidate = puzzle.solutions[session.candidates[0] ?? 0];
  const hintUci = candidate?.uci[session.history.length];
  const hintSquare =
    hintLevel > puzzle.hints.length && hintUci ? (hintUci.slice(0, 2) as Square) : null;
  const hint =
    hintLevel === 0
      ? null
      : hintLevel <= puzzle.hints.length
        ? puzzle.hints[hintLevel - 1]
        : hintSquare
          ? `Look closely at the piece on ${hintSquare}.`
          : 'Look for checks, captures, and threats.';
  return (
    <div className="exercise-area">
      <div className="exercise-heading">
        <div>
          <span className="exercise-number">EXERCISE {String(puzzle.id).padStart(3, '0')}</span>
          <h2>
            {puzzle.objective === 'mate-in-1'
              ? 'Checkmate in one'
              : puzzle.objective === 'checkmate'
                ? 'Find the checkmate'
                : puzzle.objective === 'draw'
                  ? 'Find the draw'
                  : 'Find the combination'}
          </h2>
        </div>
        <span className="turn-badge">
          <span className={`turn-dot ${puzzle.sideToMove}`} />
          {puzzle.sideToMove === 'white' ? 'White' : 'Black'} to move
        </span>
      </div>
      <div className="board-shell">
        <ChessBoard
          fen={session.fen}
          orientation={orientation}
          onMove={move}
          disabled={session.status !== 'playing' || promotion !== null}
          lastMove={session.lastMove}
          hintSquare={hintSquare}
        />
      </div>
      <div className={`feedback ${session.feedbackKind}`} role="status" aria-live="polite">
        <span aria-hidden="true">{session.status === 'solved' ? '✓' : '◇'}</span>{' '}
        {session.feedback || puzzle.description}
      </div>
      {hint && (
        <div className="hint-message" role="status">
          Hint {hintLevel}: {hint}
        </div>
      )}
      <div className="board-controls">
        <button
          aria-label="Retry exercise"
          onClick={() => {
            record('retry');
            setSession(createSession(puzzle));
            setHintLevel(0);
          }}
        >
          ↻ Retry
        </button>
        <button
          aria-label="Hint"
          onClick={() => {
            record('hint');
            setHintLevel((h) => Math.min(h + 1, puzzle.hints.length + 1));
          }}
          disabled={session.status !== 'playing'}
        >
          ◇ Hint
        </button>
        <button
          aria-label="Flip board"
          onClick={() => setOrientation((o) => (o === 'white' ? 'black' : 'white'))}
        >
          ⇅ Flip
        </button>
        <button
          className="solution-button"
          onClick={() => {
            record('reveal');
            setSession(revealSolution(puzzle, session));
          }}
          disabled={session.status === 'revealed'}
        >
          Show solution
        </button>
      </div>
      {session.status === 'revealed' && (
        <div className="solution-panel">
          <strong>Study the solution</strong>
          <p>{puzzle.solutions[0]?.explanation}</p>
          <button
            onClick={() => setSession(advanceSolution(puzzle, session))}
            disabled={session.history.length >= (puzzle.solutions[0]?.uci.length ?? 0)}
          >
            Play next move →
          </button>
        </div>
      )}
      {session.san.length > 0 && (
        <div className="move-history" aria-label="Move history">
          {session.san.map((san, i) => (
            <span key={`${i}:${san}`}>
              {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}
              {san}
            </span>
          ))}
        </div>
      )}
      <div className="exercise-stats">
        <span>{progress.attempts} attempts</span>
        <span>{progress.hints} hints</span>
        <span>
          {progress.completed
            ? progress.firstTry
              ? '✓ Solved first try'
              : '✓ Completed'
            : 'In progress'}
        </span>
      </div>
      <nav className="exercise-navigation" aria-label="Exercise navigation">
        <button aria-label="Previous exercise" onClick={onPrevious} disabled={index === 0}>
          ← Previous
        </button>
        <span>
          {index + 1} of {total} available
        </span>
        <button
          aria-label="Next exercise"
          className="primary-button"
          onClick={onNext}
          disabled={index === total - 1}
        >
          Next exercise →
        </button>
      </nav>
      <p className="source-note">
        {puzzle.source.book} · Exercise {puzzle.source.exercise}
        {puzzle.source.page ? ` · p. ${puzzle.source.page}` : ''}
        {puzzle.source.solutionPage ? ` · solution p. ${puzzle.source.solutionPage}` : ''}
        {puzzle.source.url && (
          <>
            {' '}
            ·{' '}
            <a href={puzzle.source.url} target="_blank" rel="noreferrer">
              Source ↗
            </a>
          </>
        )}
      </p>
      {promotion && (
        <div className="modal-backdrop">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="promotion-title">
            <h2 id="promotion-title">Choose your promotion</h2>
            <p>Which piece should your pawn become?</p>
            <div className="promotion-options">
              {(['q', 'r', 'b', 'n'] as const).map((piece) => (
                <button
                  key={piece}
                  onClick={() => {
                    submit(promotion.from + promotion.to + piece);
                    setPromotion(null);
                  }}
                >
                  {{ q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight' }[piece]}
                </button>
              ))}
            </div>
            <button className="text-button" onClick={() => setPromotion(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
