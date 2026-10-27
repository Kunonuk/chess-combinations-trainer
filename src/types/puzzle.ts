export interface Solution {
  uci: string[];
  san: string[];
  explanation: string;
}
export interface Puzzle {
  id: number;
  stage: number;
  chapter: string;
  objective: "mate-in-1" | "checkmate" | "combination" | "draw" | "analysis";
  description: string;
  fen: string;
  sideToMove: "white" | "black";
  solutions: Solution[];
  hints: string[];
  notes?: string[];
  source: {
    book: string;
    exercise: number;
    page?: number;
    solutionPage?: number;
    url?: string;
  };
  verification: {
    status: "verified";
    method: string;
    reviewer: string;
    evidence: string;
  };
}
export interface PuzzlePack {
  schemaVersion: 1;
  collection: {
    id: string;
    title: string;
    kind: "book" | "practice";
    total: number;
    license: "CC0" | "private-use-only" | "permission-granted";
    sourceHash?: string;
  };
  puzzles: Puzzle[];
}
