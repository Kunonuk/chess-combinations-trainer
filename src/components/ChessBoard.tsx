import { Chess, type PieceSymbol, type Square } from 'chess.js';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Piece } from './Piece';
import '../board.css';

export type BoardOrientation = 'white' | 'black';
export interface ChessBoardProps {
  fen: string;
  orientation?: BoardOrientation;
  onMove: (from: Square, to: Square) => void;
  disabled?: boolean;
  lastMove?: { from: Square; to: Square } | null;
  hintSquare?: Square | null;
}

const FILES = 'abcdefgh';
const PIECE_NAMES: Record<PieceSymbol, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

export function ChessBoard({
  fen,
  orientation = 'white',
  onMove,
  disabled = false,
  lastMove = null,
  hintSquare = null,
}: ChessBoardProps) {
  const position = useMemo(() => new Chess(fen), [fen]);
  const [selection, setSelection] = useState<{
    fen: string;
    square: Square;
  } | null>(null);
  const [focusedSquare, setFocusedSquare] = useState<Square>(orientation === 'white' ? 'a8' : 'h1');
  const cells = useRef(new Map<Square, HTMLButtonElement>());
  const board = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const drag = useRef<{
    from: Square;
    id: number;
    x: number;
    y: number;
    dragged: boolean;
    fen: string;
    orientation: BoardOrientation;
  } | null>(null);
  const selected = !disabled && selection?.fen === fen ? selection.square : null;
  const files = orientation === 'white' ? [...FILES] : [...FILES].reverse();
  const ranks = orientation === 'white' ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    drag.current = null;
    setSelection(null);
  }, [fen, disabled, orientation]);

  function startPointer(event: PointerEvent<HTMLButtonElement>, square: Square) {
    suppressClick.current = false;
    if (disabled || event.pointerType === 'touch' || event.button !== 0 || !event.isPrimary) return;
    if (position.get(square)?.color !== position.turn()) return;
    drag.current = {
      from: square,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      dragged: false,
      fen,
      orientation,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.id !== event.pointerId || disabled) return;
    if (Math.hypot(event.clientX - active.x, event.clientY - active.y) >= 6) {
      active.dragged = true;
      setSelection({ fen, square: active.from });
      event.preventDefault();
    }
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    drag.current = null;
    if (!active.dragged) return;
    suppressClick.current = true;
    setSelection(null);
    if (disabled || active.fen !== fen || active.orientation !== orientation) return;
    const rect = board.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const column = Math.floor(((event.clientX - rect.left) / rect.width) * 8);
    const row = Math.floor(((event.clientY - rect.top) / rect.height) * 8);
    if (column < 0 || column > 7 || row < 0 || row > 7) return;
    const to = `${files[column]}${ranks[row]}` as Square;
    if (active.from !== to) onMove(active.from, to);
  }

  function cancelPointer() {
    if (drag.current?.dragged) suppressClick.current = true;
    drag.current = null;
    setSelection(null);
  }

  function selectSquare(square: Square) {
    if (disabled) return;
    const piece = position.get(square);
    if (piece?.color === position.turn()) {
      setSelection(selected === square ? null : { fen, square });
    } else if (selected) {
      setSelection(null);
      onMove(selected, square);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, square: Square) {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelPointer();
      return;
    }
    const direction = orientation === 'white' ? 1 : -1;
    const offsets: Record<string, [number, number]> = {
      ArrowUp: [0, direction],
      ArrowDown: [0, -direction],
      ArrowRight: [direction, 0],
      ArrowLeft: [-direction, 0],
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const file = FILES.indexOf(square[0] ?? '') + offset[0];
    const rank = Number(square[1]) + offset[1];
    if (file < 0 || file > 7 || rank < 1 || rank > 8) return;
    cells.current.get(`${FILES[file]}${rank}` as Square)?.focus();
  }

  const fileCoordinates = (
    <div className="chess-board-files" data-testid="file-coordinates" aria-hidden="true">
      {files.map((file) => (
        <span key={file}>{file}</span>
      ))}
    </div>
  );
  const rankCoordinates = (
    <div className="chess-board-ranks" data-testid="rank-coordinates" aria-hidden="true">
      {ranks.map((rank) => (
        <span key={rank}>{rank}</span>
      ))}
    </div>
  );

  return (
    <div className="chess-board-frame">
      <div className="chess-board-edge chess-board-edge-top">{fileCoordinates}</div>
      <div className="chess-board-edge chess-board-edge-left">{rankCoordinates}</div>
      <div
        ref={board}
        data-testid="chessboard"
        role="grid"
        aria-label="Chessboard"
        aria-disabled={disabled}
        className="chess-board"
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        onPointerCancel={cancelPointer}
      >
        {ranks.map((rank) => (
          <div role="row" key={rank} className="chess-board-row">
            {files.map((file) => {
              const square = `${file}${rank}` as Square;
              const piece = position.get(square);
              const pieceName = piece
                ? `${piece.color === 'w' ? 'White' : 'Black'} ${PIECE_NAMES[piece.type]}`
                : 'empty';
              const light = (FILES.indexOf(file) + rank) % 2 === 0;
              return (
                <button
                  key={square}
                  ref={(element) => {
                    if (element) cells.current.set(square, element);
                    else cells.current.delete(square);
                  }}
                  type="button"
                  role="gridcell"
                  className={`chess-square ${light ? 'chess-square-light' : 'chess-square-dark'}`}
                  aria-label={`${square} ${pieceName}`}
                  aria-selected={selected === square}
                  aria-disabled={disabled}
                  data-square={square}
                  data-testid={`square-${square}`}
                  data-last-move={lastMove?.from === square || lastMove?.to === square}
                  data-hint={hintSquare === square}
                  tabIndex={focusedSquare === square ? 0 : -1}
                  onFocus={() => setFocusedSquare(square)}
                  onKeyDown={(event) => handleKeyDown(event, square)}
                  onPointerDown={(event) => startPointer(event, square)}
                  onClick={(event) => {
                    if (suppressClick.current && event.detail > 0) {
                      suppressClick.current = false;
                      return;
                    }
                    selectSquare(square);
                  }}
                >
                  {piece && <Piece type={piece.type} color={piece.color} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="chess-board-edge chess-board-edge-right">{rankCoordinates}</div>
      <div className="chess-board-edge chess-board-edge-bottom">{fileCoordinates}</div>
    </div>
  );
}
