# Source and redistribution

Original application code: MIT (see LICENSE). No publisher art, scanned pages or PDF is tracked.

The supplied book is Sergey Ivashchenko, The Manual of Chess Combinations, Volume 1a, Moscow 2007, ISBN 5-94693-045-1, © Russian Chess House 2007. Printed page 2 (PDF page 3) carries an all-rights-reserved notice. The supplied scan contains exercises 1–719. SHA-256: `742323aafa1d76b854b4f323d71826f2ead8a65cd72964f8bc65fbd846420f86`.

Owning a scan does not establish permission to republish the collection. Whether individual chess positions are protectable and whether this collection's selection, sequence, text or explanations can be republished are separate unresolved questions. Copyright Office guidance recognizes potential protection in original compilation selection and arrangement: https://www.copyright.gov/register/tx-compilations.html and https://www.copyright.gov/register/tx-databases.html. This is a conservative engineering boundary, not a jurisdiction-specific legal determination. Obtain publisher permission or an applicable rights determination before distributing the book collection.

The complete derived exercise collection is included in tracked `src/data/book.json` and bundled in default builds, as explicitly requested by the project owner. Its existing `private-use-only` metadata and source attribution are retained; inclusion does not mean publisher permission has been verified or that the book data are covered by the application’s MIT license. Optional local packs remain ignored under `src/data/private/`. The source PDF, scans and intermediate transcription/audit files remain outside Git.

The separate public practice collection reproduces the four official examples from https://database.lichess.org/#puzzles, under the database's CC0 dedication. IDs: 00sHx, 00sJ9, 00sJb, 00sO1. The first UCI move is the opponent's setup move and has already been applied to each presented FEN, as documented by the source. Source solutions are preserved and converted to SAN with chess.js. No Stockfish execution by this project is claimed. The book's exercise numbers are never assigned to these puzzles.

Chess pieces are original SVG geometry authored for this application. Dependencies retain their respective licenses in npm packages.
