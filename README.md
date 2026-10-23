# Chess Combinations Trainer

A chess practice app for improving tactical skills and recognizing checkmates and winning combinations. Study a position, play your move, and compare it with a checked solution.

The book collection includes all **719 original diagrams**, in their original order across three study stages: **718 scored puzzles and one unscored source-error study**. It loads automatically. The separate four-puzzle Lichess practice collection remains available in the collection selector.

Use hints, replay a solution, retry an exercise, or navigate by chapter and original exercise number. Study history and the last visited exercise stay in your browser. Older partial imported packs do not hide the complete collection after a refresh; existing study history is preserved.

## Source notes

Affected exercises explain printed errors beside the board. Exercise 351 requires up to three moves rather than the printed two. Exercise 419 uses a documented coordinate correction. Exercise 389 preserves the original diagram and demonstrates the legal escape from the printed attack; it is available for study and is excluded from solved-puzzle totals.

All diagrams were reviewed against the supplied edition and all included moves were checked for legality. Mate-in-one alternatives and the mate-in-two defenses were exhaustively enumerated. Material combinations retain the book’s answer prefixes with checked illustrative continuations; they are not a claim of globally optimal play or a net full-piece gain against every defense. Draw examples reproduce legal variations ending in a terminal draw.

Book-derived data retain the `private-use-only` designation and source attribution. The separate Lichess practice data are CC0. The source PDF, scans and intermediate transcription files are not part of this repository.

## Run locally

Requires Node.js 24.15 or newer within the 24.x series, and npm 11.

```sh
npm ci
npm run dev
```

Open the local address shown in your terminal.

## Checks

```sh
npm run verify
CI=true npm run test:e2e -- --config=playwright.ci.config.ts
```

The browser command uses the production build created by `verify` and runs headlessly on desktop and mobile Chromium. Data validation also exercises every included solution through the trainer engine and replays every line.
