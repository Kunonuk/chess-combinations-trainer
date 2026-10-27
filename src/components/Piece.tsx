import type { Color, PieceSymbol } from "chess.js";
import type { ReactNode } from "react";

export interface PieceProps {
  type: PieceSymbol;
  color: Color;
}

// Original geometric silhouettes, drawn in a shared 80 × 80 viewBox.
const SHAPES: Record<PieceSymbol, ReactNode> = {
  p: (
    <>
      <path d="M33 34h14c-4 9-3 15 5 23H28c8-8 9-14 5-23Z" />
      <circle cx="40" cy="25" r="10" />
      <path className="chess-piece-detail" d="M30 56h20M32 38h16" />
    </>
  ),
  n: (
    <>
      <path d="M26 58c1-12 10-16 10-24l-9 3-5-6 12-15 1-5 8 7h5l7 11 4 11-8 4-8-6c-2 9 5 12 7 20Z" />
      <path
        className="chess-piece-detail"
        d="M35 20c11 3 9 13 8 18M27 31l7-2M29 53h17"
      />
      <circle
        className="chess-piece-eye"
        cx="46"
        cy="27"
        r="1.8"
        stroke="none"
      />
    </>
  ),
  b: (
    <>
      <path d="M40 12c-5 7-13 12-13 21 0 6 4 10 8 12-1 5-4 9-8 13h26c-4-4-7-8-8-13 4-2 8-6 8-12 0-9-8-14-13-21Z" />
      <path className="chess-piece-detail" d="m43 22-9 13M33 45h14M30 54h20" />
    </>
  ),
  r: (
    <>
      <path d="M23 16h9v9h5v-9h6v9h5v-9h9v18l-6 6v17H29V40l-6-6Z" />
      <path className="chess-piece-detail" d="M25 34h30M29 41h22M29 53h22" />
    </>
  ),
  q: (
    <>
      <path d="m24 25 10 11 6-17 6 17 10-11-6 28 3 6H27l3-6Z" />
      <circle cx="23" cy="22" r="4" />
      <circle cx="40" cy="16" r="4" />
      <circle cx="57" cy="22" r="4" />
      <path className="chess-piece-detail" d="M29 47h22M30 53h20" />
    </>
  ),
  k: (
    <>
      <path d="M37 11h6v7h7v6h-7v8h-6v-8h-7v-6h7Z" />
      <path d="M28 29c-9 0-10 12-5 18l8 11h18l8-11c5-6 4-18-5-18-5 0-8 4-12 8-4-4-7-8-12-8Z" />
      <path className="chess-piece-detail" d="M40 37v13M27 49h26M30 55h20" />
    </>
  ),
};

export function Piece({ type, color }: PieceProps) {
  return (
    <svg
      className={`chess-piece chess-piece-${color === "w" ? "white" : "black"}`}
      viewBox="0 0 80 80"
      aria-hidden="true"
      focusable="false"
    >
      <g strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round">
        {SHAPES[type]}
        <path d="M26 58h28l5 8v4H21v-4Z" />
        <path className="chess-piece-detail" d="M25 65h30" />
      </g>
    </svg>
  );
}
