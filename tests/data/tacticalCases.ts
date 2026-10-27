interface TacticalCase {
  readonly id: number;
  readonly objective: "mate-in-1" | "checkmate" | "combination" | "draw";
  readonly initialFen: string;
  readonly finalFen: string;
  readonly playerMoves: readonly string[];
  readonly history: readonly string[];
  readonly feedback: string;
}

// Reviewed, frozen browser oracles. These values deliberately do not import the
// application catalogue or calculate expected outcomes with its chess engine.
// FENs and SAN were checked offline against the complete legal lines, including
// black-first numbering, automatic replies, castling, promotion and stalemate.
export const tacticalCases: readonly TacticalCase[] = [
  {
    id: 1,
    objective: "mate-in-1",
    initialFen: "4k3/8/4K3/8/8/8/R7/8 w - - 0 1",
    finalFen: "R3k3/8/4K3/8/8/8/8/8 b - - 1 1",
    playerMoves: ["a2a8"],
    history: ["1. Ra8#"],
    feedback: "✓ Correct! Checkmate.",
  },
  {
    id: 148,
    objective: "mate-in-1",
    initialFen: "7k/pp4b1/3p3p/8/2PPP3/5bB1/5pBP/7K b - - 0 1",
    finalFen: "7k/pp4b1/3p3p/8/2PPP3/5bB1/6BP/5q1K w - - 0 2",
    playerMoves: ["f2f1q"],
    history: ["1... f1=Q#"],
    feedback: "✓ Correct! Checkmate.",
  },
  {
    id: 151,
    objective: "combination",
    initialFen: "1n6/4k2p/2Q3p1/5p2/8/8/7r/3K4 w - - 0 1",
    finalFen: "8/3nk2p/6p1/5p2/8/8/7Q/3K4 b - - 0 2",
    playerMoves: ["c6c7", "c7h2"],
    history: ["1. Qc7+", "Nd7", "2. Qxh2"],
    feedback: "✓ Correct! You found the winning combination.",
  },
  {
    id: 241,
    objective: "draw",
    initialFen: "8/8/2k5/K7/7R/8/8/2q5 w - - 0 1",
    finalFen: "8/8/2k5/K7/2q5/8/8/8 w - - 0 2",
    playerMoves: ["h4c4"],
    history: ["1. Rc4+", "Qxc4"],
    feedback: "✓ Correct! Draw.",
  },
  {
    id: 258,
    objective: "draw",
    initialFen: "1k1K4/8/8/QP2n3/3n4/8/8/8 b - - 0 1",
    finalFen: "1k2K3/8/8/n7/8/8/8/8 w - - 0 4",
    playerMoves: ["e5c6", "d4c6", "c6a5"],
    history: ["1... Nec6+", "2. bxc6", "Nxc6+", "3. Ke8", "Nxa5"],
    feedback: "✓ Correct! Draw.",
  },
  {
    id: 271,
    objective: "checkmate",
    initialFen: "r1bk1b1r/ppp2ppp/2p5/8/4n1q1/8/PPPB2PP/2KR1B1R w - - 0 1",
    finalFen: "r1bRkb1r/ppp2ppp/2p5/6B1/4n1q1/8/PPP3PP/2K2B1R b - - 3 2",
    playerMoves: ["d2g5", "d1d8"],
    history: ["1. Bg5+", "Ke8", "2. Rd8#"],
    feedback: "✓ Correct! Checkmate.",
  },
  {
    id: 351,
    objective: "checkmate",
    initialFen: "8/1pQ2pk1/4qn1p/p3p1p1/1Pb1P3/P1P1BPP1/2B3KP/8 b - - 0 1",
    finalFen: "8/1pQ2pk1/5n1p/p3p1p1/1Pb1P3/P1P2qP1/2B4P/6BK w - - 0 4",
    playerMoves: ["e6h3", "h3f1", "f1f3"],
    history: ["1... Qh3+", "2. Kh1", "Qf1+", "3. Bg1", "Qxf3#"],
    feedback: "✓ Correct! Checkmate.",
  },
  {
    id: 419,
    objective: "checkmate",
    initialFen: "5rk1/4pp1p/1b1p2p1/1N1P4/Q3P3/2Rn4/1P3qPP/R6K b - - 0 1",
    finalFen: "5rk1/4pp1p/1b1p2p1/1N1P4/Q3P3/2R5/1P3nPP/6RK w - - 1 3",
    playerMoves: ["f2g1", "d3f2"],
    history: ["1... Qg1+", "2. Rxg1", "Nf2#"],
    feedback: "✓ Correct! Checkmate.",
  },
  {
    id: 605,
    objective: "combination",
    initialFen: "r1bqk2r/ppp2ppp/2np4/8/N1B1PB2/3P2P1/PPP4n/R2QK1R1 w k - 0 1",
    finalFen: "r1bq1rk1/ppp2ppp/2np4/8/N1B1PB2/3P2P1/PPP4Q/R3K1R1 b - - 0 2",
    playerMoves: ["d1h5", "h5h2"],
    history: ["1. Qh5", "O-O", "2. Qxh2"],
    feedback: "✓ Correct! You found the winning combination.",
  },
  {
    id: 631,
    objective: "combination",
    initialFen: "2q2rk1/5pbp/4p1p1/Bp2nnN1/2P5/P3P1PP/2Q2P1N/4K2R b K - 0 1",
    finalFen: "5rk1/5pbp/4p1p1/qp2nnN1/2P5/P3P1PP/2Q2P1N/5RK1 w - - 0 3",
    playerMoves: ["c8a8", "a8a5"],
    history: ["1... Qa8", "2. O-O", "Qxa5"],
    feedback: "✓ Correct! You found the winning combination.",
  },
  {
    id: 702,
    objective: "combination",
    initialFen: "r3kb1r/pp1b1pp1/8/1Bq3Qp/8/2P5/P4PPP/R4RK1 w - - 0 1",
    finalFen: "r3kb1r/pp1bRpp1/8/1B4Qp/8/2P5/P4PPP/R5K1 b - - 0 2",
    playerMoves: ["f1e1", "e1e7"],
    history: ["1. Rfe1+", "Qe7", "2. Rxe7+"],
    feedback: "✓ Correct! You found the winning combination.",
  },
  {
    id: 719,
    objective: "combination",
    initialFen: "4q3/8/6kp/3N2n1/6Q1/5pK1/8/8 w - - 0 1",
    finalFen: "4Q3/6k1/7p/3N2n1/8/5pK1/8/8 b - - 0 2",
    playerMoves: ["g4h5", "h5e8"],
    history: ["1. Qh5+", "Kg7", "2. Qxe8"],
    feedback: "✓ Correct! You found the winning combination.",
  },
];

export const practiceMateCase = {
  initialFen: "q5nr/1ppknQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 w - - 1 18",
  finalFen: "q2k1Qnr/1pp1n1pp/3pB3/1P2p3/4P3/B1PP1b2/6PP/5K2 b - - 4 19",
  history: ["18. Be6+", "Kd8", "19. Qf8#"],
  feedback: "✓ Correct! Checkmate.",
} as const;

export const sourceErrorCase = {
  initialFen: "8/5pkp/p3p1p1/5n2/3P4/P2R1NP1/3RQPK1/1rq4r b - - 0 1",
  finalFen: "8/5pkp/p3p1p1/5n2/3P4/P2R2PK/3RQP1N/1r5q b - - 2 3",
  history: ["1... Rh2+", "2. Nxh2", "Qh1+", "3. Kh3"],
} as const;
