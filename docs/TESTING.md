# Testing the trainer

Use Node 24.x (at least 24.15) and npm 11. Install the committed dependencies with
`npm ci`. The framework uses the existing Playwright and Vitest dependencies.

## Folder ownership

```text
app.config.ts                  Shared deployment base path
playwright.config.ts           Headless projects, baseURL and development server
playwright.ci.config.ts         Same settings with the production preview server
tests/
  e2e/
    book.spec.ts              719 positions, independent tactical cases, cumulative progress
    trainer.spec.ts           Focused assistance/scoring and persistence journeys
    imports.spec.ts           Imports, replacement rejection and upload-size boundary
    storage.spec.ts           Corrupt state and browser storage read/write failures
    interactions.spec.ts      Real mouse dragging and keyboard board interaction
    promotions.spec.ts        All four promotion choices and cancellation
    accessibility.spec.ts     Dialog names, focus containment, Escape and restoration
    appearance.spec.ts        Appearance rendering and persistence
    smoke.spec.ts             Navigation response, title and heading semantics
  pages/
    BasePage.ts                Shared open/reload lifecycle and readiness contract
    TrainerPage.ts             Application locators, actions and navigation
    components/ChessBoard.ts   Typed squares, native input, promotion and board observations
  fixtures/
    trainer.ts                 Playwright objects, practice setup and error capture
    storage.ts                 Typed, origin-scoped browser storage scenarios
    promotion.ts               Synthetic promotion positions for each piece
    bookPack.ts, puzzles.ts    Fresh synthetic puzzle/pack factories shared with Vitest
  data/
    book.ts                    Bundled book positions
    tacticalCases.ts           Reviewed, independent FEN/history/result oracles
    solutions.ts               Player moves, excluding automatic opponent replies
  support/
    routes.ts                  Relative application routes
    boardAssertions.ts         Poll all 64 rendered square labels against a FEN
    app.ts, chessboard.ts      React Testing Library helpers for unit tests
    savedProgress.ts          Typed assertions against actual stored JSON
  unit/
    appStudy.test.tsx          Study controls, source-error playback and move history
    appImports.test.tsx        Verified-pack import and cache validation
    appPersistence.test.tsx    Progress, reset and saved-location behavior
    appAppearance.test.tsx     Appearance restoration and storage failures
    studyProgress.test.tsx     StrictMode committed persistence and failure handling
    fixtureContracts.test.ts  Guard failures and factory isolation
    *.test.ts                 Engine, storage, data and board coverage
  setup.ts                     Vitest DOM setup
```

## Objects, fixtures and navigation

Import `test` and `expect` from `tests/fixtures/trainer.ts`. The test-scoped `trainer`
fixture constructs the page object without navigating; call `trainer.open()` to
inspect the default book collection or the navigation response. The `practice`
fixture opens the app and selects the separate practice collection at exercise 1.
Use `practice: trainer` when a scenario needs that setup.

```typescript
import { expect, test } from '../fixtures/trainer.ts';

test('rejects an illegal move without completing the exercise', async ({ practice: trainer }) => {
  const initial = await trainer.board.position();
  await trainer.board.move('a2', 'a4');
  await expect(trainer.feedback()).toContainText('That move is illegal.');
  await expect.poll(() => trainer.board.position()).toEqual(initial);
  await expect(trainer.progress()).toHaveAttribute('value', '0');
});
```

`BasePage` owns `open()` and `reload()`. Each operation waits for the concrete
page's readiness hook before returning; `open()` preserves the navigation response
for assertions. Routes are supplied by the concrete page and resolved against
Playwright's `baseURL`.

`TrainerPage` extends `BasePage` and supplies `routes.trainer`. Its readiness hook
checks the heading and all 64 board squares. It owns the library, appearance,
import, study and reset controls, and composes `ChessBoard` as a component. Both
objects provide methods returning
`Locator` instances for assertions and reusable scopes, such as
`trainer.feedback()` and `trainer.board.square('a2')`. Constructors only store
dependencies and initialize component objects. Actions reuse locator methods when
the same element is also asserted; single-use interactions resolve test IDs inline.
Each selector stays in one place. Behavior decisions and expected outcomes stay
in specs. Navigation includes the deployed project subpath, and fixture and test
callers continue to use `trainer.open()` and `trainer.reload()`.

All element identification uses stable `data-testid` values. The catalogue locator
also uses the semantic option role to filter disabled entries, including entries
inside the collapsed coverage panel. Text and CSS checks assert visible behavior;
they do not locate elements. An ordinal is used only to address a chronological
move in the move history.

The board accepts chess.js `Square` values. It chooses real taps or clicks using
the project's `hasTouch` capability, and validates UCI input before playing a move
and choosing any promotion. Dragging uses native mouse movement with pointer
capture; keyboard methods use native Enter, arrows and Escape. Focus assertions
verify real focus transitions, including input after completion being ignored.
Position and hint checks poll rendered board state.
Test timeouts on the full catalogue and long tactical scenario are execution
budgets, rather than sleeps or substitutes for readiness. Catalogue and cumulative
loops use named `test.step()` blocks. Each of the 12
representative tactical exercises is also an independently runnable test, so an
unrelated failure cannot prevent the other cases from starting.

Each test receives Playwright's fresh browser context and storage. Reloads retain
that test's progress, appearance and imported pack. Factories return fresh data;
imports use in-memory file payloads, with no shared files or storage snapshots.
`fixturePuzzle(pack, index)` checks fixture assumptions and reports the collection
and missing index. Pack arrays stay mutable so negative tests can deliberately
empty or replace their contents.
The automatic error fixture listens before setup, fails on uncaught/console
errors, attaches `browser-errors` diagnostics when needed, and removes its
listeners during teardown. The page/context lifecycle remains Playwright's.

## Running checks

```sh
npm run verify
env -u PWDEBUG -u HEADED npm run test:e2e
```

`verify` checks types, lint, formatting, unit/component tests, puzzle data and the
production build. The browser command starts the development server automatically.
To run against the production build using the unchanged CI workflow configuration:

```sh
npm run build
env -u PWDEBUG -u HEADED CI=true npm run test:e2e -- --config=playwright.ci.config.ts
```

Both browser configurations run desktop and mobile Chromium headlessly, with two
workers, full parallelism and zero retries. Port 4173 must be available; the runner
owns and stops its server. Separate concurrent suite invocations require separate
server ports and output directories. To focus a scenario, select its spec and/or
`--grep`; do not enable headed/debug mode.

```sh
env -u PWDEBUG -u HEADED npm run test:e2e -- tests/e2e/imports.spec.ts --project=chromium
```

The HTML report is `playwright-report/index.html`. On failure, screenshots, traces
and error context are in `test-results/`; browser diagnostics are attached to the
report. CI retains these artifacts through its existing failure-artifact step.

## Extending coverage

Add a meaningful stable test ID to an application element only when a scenario
needs to identify it. Define its locator and interaction in the relevant object;
keep assertions in the spec. Use a component object when there is a cohesive,
reusable interaction boundary, rather than introducing a base page or an object
for each visual panel. Add factories for mutable data, not global mutable state.

Preserve the original behavior coverage on both projects, including the exhaustive
719-position traversal, special moves, both repetition-draw sides, source-error
playback, import rejection, progress reset and appearance persistence. Use
web-first assertions and polling for derived state; avoid arbitrary waits, forced
interactions, shared state, skipped tests and conditional assertion bypasses.

Design references: Playwright's [page objects](https://playwright.dev/docs/pom),
[fixtures](https://playwright.dev/docs/test-fixtures) and
[best practices](https://playwright.dev/docs/best-practices).

## Application boundaries and async safety

`App.tsx` composes `AppearanceControls`, `Study`, `StudyLibrary` and
`ResetProgressDialog`. `useAppearance` owns appearance preferences;
`useStudyLibrary` owns catalogue selection and imports; `useStudyProgress` persists
committed progress snapshots outside React updater callbacks. Updaters remain
pure and accumulate the attempt, mistake and solve events from each move.
`studyStorage.ts` owns the existing import edition/cache rules and storage keys.

Progress persistence skips initial hydration and duplicate effect replay. Storage
failures retain the active session and existing notices. A StrictMode regression
test checks actual stored progress and one committed write for an incorrect move;
additional cases cover failed writes and imported-pack session fallback.

TypeScript/TSX files use `recommendedTypeChecked` with TypeScript project-service
analysis. The existing ESLint command also catches floating promises and promises
passed to void-only callbacks. JavaScript remains covered by the recommended JS
rules. No test files are excluded and no new lint dependencies are required.

## Test design and supported matrix

Desktop and mobile Chromium are the supported browser targets. The mobile project
uses touch and viewport emulation in Chromium. No Firefox or WebKit projects are
required by either configuration or by CI.

Representative tactical cases pin the player moves, initial/final FEN, complete
formatted history and exact result feedback in `tests/data/tacticalCases.ts`.
These constants do not derive expectations from the running application or import
its catalogue. Review changes to these oracles independently; do not regenerate
them from a failing application's output. The complete catalogue traversal still
checks rendering against all 719 bundled positions, and a separate journey checks
12 accumulated solves and persistence after reload.

Hints, playback, retry cleanup and assisted scoring have independent scenarios.
Cumulative attempt-count, reset and persistence cases remain explicit journeys.
Both board orientations, outside-board drag cancellation, keyboard solving,
post-completion input blocking, four promotion pieces, and promotion cancellation
exercise the actual browser input path. Dialog tests cover labels, initial focus,
forward/backward Tab containment, Escape and focus restoration.

Storage boundary tests extend the standard fixtures through a typed
`storageScenario` option. Setup runs before navigation and is scoped to the
configured app origin. Overrides affect that test context's localStorage only;
sessionStorage is preserved. Corrupt initial data is seeded only while its key is
absent, so a reload can observe progress the app subsequently saves.

Component interaction tests create a per-test `userEvent.setup()` user and await
clicks, selectOptions and uploads. `moveInStudy(user, from, to)` and
`uploadStudyJSON(user, raw)` are async helpers. Low-level pointer simulations remain
in board tests that deliberately exercise event mechanics.

## Parallel stability check

After the full suite passes, repeat the import, storage, persistence and reset
scenarios with four workers and zero retries:

```sh
env -u PWDEBUG -u HEADED npm run test:e2e -- \
  tests/e2e/imports.spec.ts tests/e2e/storage.spec.ts tests/e2e/trainer.spec.ts \
  --grep 'imports numbered|malformed JSON|oversized upload|rejected replacement|corrupt saved progress|storage read denied|storage write denied|keeps solved progress|cancelled reset' \
  --repeat-each=5 --workers=4 --reporter=list --output=/tmp/chess-testing-stability-results
```

This focused repetition does not replace the full suite or hide failures behind
retries. The separate output path preserves the full suite's HTML report. Inspect
any failure's trace and state before changing synchronization or execution budgets.
