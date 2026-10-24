import { useState } from 'react';
import { AppearanceControls } from './components/AppearanceControls.tsx';
import { ResetProgressDialog } from './components/ResetProgressDialog.tsx';
import { Study } from './components/Study.tsx';
import { StudyLibrary } from './components/StudyLibrary.tsx';
import { useAppearance } from './hooks/useAppearance.ts';
import { useStudyLibrary } from './hooks/useStudyLibrary.ts';
import { emptyPuzzleProgress } from './services/progress.ts';
import './App.css';

export default function App() {
  const { dark, boardTheme, setBoardTheme, toggleAppearance } = useAppearance();
  const {
    packs,
    pack,
    puzzle,
    progress,
    notice,
    setNotice,
    studyRevision,
    navigate,
    record,
    importPack,
    resetProgress,
  } = useStudyLibrary();
  const [resetOpen, setResetOpen] = useState(false);
  const currentProgress =
    pack && puzzle
      ? (progress.collections[pack.collection.id]?.[puzzle.id] ?? emptyPuzzleProgress())
      : emptyPuzzleProgress();
  return (
    <div data-testid="trainer" className={`app ${dark ? 'dark' : ''} board-theme-${boardTheme}`}>
      <AppearanceControls
        dark={dark}
        boardTheme={boardTheme}
        onThemeChange={setBoardTheme}
        onToggle={toggleAppearance}
      />
      <main data-testid="study-layout" id="main" className="study-layout">
        <section className="study-main">
          <div className="eyebrow">A LITTLE PRACTICE. A CLEARER MIND.</div>
          <h1 data-testid="trainer-heading">Find the beautiful move.</h1>
          <p className="intro">Take your time. See the whole board. Make every move count.</p>
          {notice && (
            <div data-testid="import-notice" className="notice" role="status">
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
        <StudyLibrary
          packs={packs}
          pack={pack}
          puzzle={puzzle}
          progress={progress}
          onNavigate={navigate}
          onImport={importPack}
          onReset={() => setResetOpen(true)}
        />
      </main>
      <footer>
        Study slowly. Remember deeply.<span>COMBINATIONS · A PERSONAL CHESS PRACTICE</span>
      </footer>
      {resetOpen && (
        <ResetProgressDialog
          onCancel={() => setResetOpen(false)}
          onConfirm={() => {
            resetProgress();
            setResetOpen(false);
          }}
        />
      )}
    </div>
  );
}
