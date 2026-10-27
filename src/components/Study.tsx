import { useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { useDialogFocus } from "../hooks/useDialogFocus.ts";
import { ChessBoard } from "./ChessBoard.tsx";
import {
  createSession,
  attemptMove,
  revealSolution,
  advanceSolution,
} from "../services/chessEngine.ts";
import type { ProgressEvent, PuzzleProgress } from "../services/progress.ts";
import type { Puzzle } from "../types/puzzle.ts";

interface StudyProps {
  puzzle: Puzzle;
  progress: PuzzleProgress;
  record: (event: ProgressEvent) => void;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}
export function Study({
  puzzle,
  progress,
  record,
  index,
  total,
  onPrevious,
  onNext,
}: StudyProps) {
  const [session, setSession] = useState(() => createSession(puzzle));
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [hintLevel, setHintLevel] = useState(0);
  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const promotionDialog = useRef<HTMLDivElement>(null);
  useDialogFocus(promotionDialog, () => setPromotion(null), promotion !== null);
  function submit(uci: string) {
    const result = attemptMove(puzzle, session, uci);
    record("attempt");
    if (result.outcome === "incorrect" || result.outcome === "illegal")
      record("mistake");
    if (result.outcome === "solved") record("solve");
    setSession(result.session);
  }
  function move(from: Square, to: Square) {
    const piece = new Chess(session.fen).get(from);
    if (piece?.type === "p" && (to[1] === "1" || to[1] === "8")) {
      setPromotion({ from, to });
      return;
    }
    submit(from + to);
  }
  const candidate = puzzle.solutions[session.candidates[0] ?? 0];
  const hintUci = candidate?.uci[session.history.length];
  const hintSquare =
    hintLevel > puzzle.hints.length && hintUci
      ? (hintUci.slice(0, 2) as Square)
      : null;
  const hint =
    hintLevel === 0
      ? null
      : hintLevel <= puzzle.hints.length
        ? puzzle.hints[hintLevel - 1]
        : hintSquare
          ? `Look closely at the piece on ${hintSquare}.`
          : "Look for checks, captures, and threats.";
  return (
    <div className="exercise-area">
      {puzzle.notes && (
        <div
          data-testid="source-note"
          className="notice"
          role="note"
          aria-label="Source note"
        >
          {puzzle.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}
      <div className="exercise-heading">
        <div>
          <span data-testid="exercise-number" className="exercise-number">
            EXERCISE {String(puzzle.id).padStart(3, "0")}
          </span>
          <h2 data-testid="study-heading">
            {puzzle.objective === "analysis"
              ? "Study the source error"
              : puzzle.objective === "mate-in-1"
                ? "Checkmate in one"
                : puzzle.objective === "checkmate"
                  ? "Find the checkmate"
                  : puzzle.objective === "draw"
                    ? "Find the draw"
                    : "Find the combination"}
          </h2>
        </div>
        <span className="turn-badge">
          <span className={`turn-dot ${puzzle.sideToMove}`} />
          {puzzle.sideToMove === "white" ? "White" : "Black"} to move
        </span>
      </div>
      <div className="board-shell">
        <ChessBoard
          fen={session.fen}
          orientation={orientation}
          onMove={move}
          disabled={session.status !== "playing" || promotion !== null}
          lastMove={session.lastMove}
          hintSquare={hintSquare}
        />
      </div>
      <div
        data-testid="study-feedback"
        className={`feedback ${session.feedbackKind}`}
        role="status"
        aria-live="polite"
      >
        <span aria-hidden="true">
          {session.status === "solved" ? "✓" : "◇"}
        </span>{" "}
        {session.feedback || puzzle.description}
      </div>
      {hint && (
        <div data-testid="hint-message" className="hint-message" role="status">
          Hint {hintLevel}: {hint}
        </div>
      )}
      <div className="board-controls">
        <button
          data-testid="retry-exercise"
          aria-label="Retry exercise"
          onClick={() => {
            record("retry");
            setSession(createSession(puzzle));
            setHintLevel(0);
          }}
        >
          ↻ Retry
        </button>
        <button
          data-testid="show-hint"
          aria-label="Hint"
          onClick={() => {
            record("hint");
            setHintLevel((h) => Math.min(h + 1, puzzle.hints.length + 1));
          }}
          disabled={session.status !== "playing"}
        >
          ◇ Hint
        </button>
        <button
          data-testid="flip-board"
          aria-label="Flip board"
          onClick={() =>
            setOrientation((o) => (o === "white" ? "black" : "white"))
          }
        >
          ⇅ Flip
        </button>
        <button
          data-testid="show-solution"
          className="solution-button"
          onClick={() => {
            record("reveal");
            setSession(revealSolution(puzzle, session));
          }}
          disabled={session.status === "revealed"}
        >
          Show solution
        </button>
      </div>
      {session.status === "revealed" && (
        <div data-testid="solution-panel" className="solution-panel">
          <strong>
            {puzzle.objective === "analysis"
              ? "Study the source error"
              : "Study the solution"}
          </strong>
          <p>{puzzle.solutions[0]?.explanation}</p>
          <button
            data-testid="play-next-move"
            onClick={() => setSession(advanceSolution(puzzle, session))}
            disabled={
              session.history.length >= (puzzle.solutions[0]?.uci.length ?? 0)
            }
          >
            Play next move →
          </button>
        </div>
      )}
      {session.san.length > 0 && (
        <div
          data-testid="move-history"
          className="move-history"
          aria-label="Move history"
        >
          {session.san.map((san, i) => {
            const ply = i + (puzzle.sideToMove === "black" ? 1 : 0);
            const number =
              Number(puzzle.fen.split(" ")[5]) + Math.floor(ply / 2);
            const prefix =
              ply % 2 === 0 ? `${number}. ` : i === 0 ? `${number}... ` : "";
            return (
              <span data-testid="history-move" key={`${i}:${san}`}>
                {prefix}
                {san}
              </span>
            );
          })}
        </div>
      )}
      <div data-testid="exercise-stats" className="exercise-stats">
        <span>{progress.attempts} attempts</span>
        <span>{progress.hints} hints</span>
        <span>
          {puzzle.objective === "analysis"
            ? "Source note · not scored"
            : progress.completed
              ? progress.firstTry
                ? "✓ Solved first try"
                : "✓ Completed"
              : "In progress"}
        </span>
      </div>
      <nav className="exercise-navigation" aria-label="Exercise navigation">
        <button
          data-testid="previous-exercise"
          aria-label="Previous exercise"
          onClick={onPrevious}
          disabled={index === 0}
        >
          ← Previous
        </button>
        <span>
          {index + 1} of {total} available
        </span>
        <button
          data-testid="next-exercise"
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
        {puzzle.source.page ? ` · p. ${puzzle.source.page}` : ""}
        {puzzle.source.solutionPage
          ? ` · solution p. ${puzzle.source.solutionPage}`
          : ""}
        {puzzle.source.url && (
          <>
            {" "}
            ·{" "}
            <a href={puzzle.source.url} target="_blank" rel="noreferrer">
              Source ↗
            </a>
          </>
        )}
      </p>
      {promotion && (
        <div className="modal-backdrop">
          <div
            ref={promotionDialog}
            tabIndex={-1}
            data-testid="promotion-dialog"
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="promotion-title"
          >
            <h2 id="promotion-title">Choose your promotion</h2>
            <p>Which piece should your pawn become?</p>
            <div className="promotion-options">
              {(["q", "r", "b", "n"] as const).map((piece) => (
                <button
                  key={piece}
                  data-testid={`promote-${piece}`}
                  onClick={() => {
                    submit(promotion.from + promotion.to + piece);
                    setPromotion(null);
                  }}
                >
                  {{ q: "Queen", r: "Rook", b: "Bishop", n: "Knight" }[piece]}
                </button>
              ))}
            </div>
            <button
              data-testid="cancel-promotion"
              className="text-button"
              onClick={() => setPromotion(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
