import { expect, type Locator, type Page } from '@playwright/test';
import type { PuzzlePack } from '../../src/types/puzzle.ts';
import { routes } from '../support/routes.ts';
import { BasePage } from './BasePage.ts';
import { ChessBoard } from './components/ChessBoard.ts';

type Collection = 'ivashchenko-1a' | 'lichess-practice';
type BoardTheme = 'forest' | 'walnut';

export class TrainerPage extends BasePage {
  readonly board: ChessBoard;

  constructor(page: Page, hasTouch: boolean) {
    super(page, routes.trainer);
    this.board = new ChessBoard(page, hasTouch);
  }

  root(): Locator {
    return this.page.getByTestId('trainer');
  }

  main(): Locator {
    return this.root().getByTestId('study-layout');
  }

  heading(): Locator {
    return this.main().getByTestId('trainer-heading');
  }

  collection(): Locator {
    return this.root().getByTestId('collection-select');
  }

  exercise(): Locator {
    return this.root().getByTestId('exercise-select');
  }

  availableBookExercises(): Locator {
    return this.root()
      .getByTestId('book-catalogue')
      .getByTestId(/^book-exercise-\d+$/)
      .and(this.page.getByRole('option', { disabled: false, includeHidden: true }));
  }

  progress(): Locator {
    return this.root().getByTestId('collection-progress');
  }

  exerciseNumber(): Locator {
    return this.root().getByTestId('exercise-number');
  }

  studyHeading(): Locator {
    return this.root().getByTestId('study-heading');
  }

  sourceNote(): Locator {
    return this.root().getByTestId('source-note');
  }

  feedback(): Locator {
    return this.root().getByTestId('study-feedback');
  }

  stats(): Locator {
    return this.root().getByTestId('exercise-stats');
  }

  notice(): Locator {
    return this.root().getByTestId('import-notice');
  }

  hintMessage(): Locator {
    return this.root().getByTestId('hint-message');
  }

  hintButton(): Locator {
    return this.root().getByTestId('show-hint');
  }

  solutionPanel(): Locator {
    return this.root().getByTestId('solution-panel');
  }

  playNextMoveButton(): Locator {
    return this.root().getByTestId('play-next-move');
  }

  previousExerciseButton(): Locator {
    return this.root().getByTestId('previous-exercise');
  }

  nextExerciseButton(): Locator {
    return this.root().getByTestId('next-exercise');
  }

  resetDialog(): Locator {
    return this.root().getByTestId('reset-dialog');
  }

  boardTheme(): Locator {
    return this.root().getByTestId('board-theme-select');
  }

  appearanceToggle(): Locator {
    return this.root().getByTestId('appearance-toggle');
  }

  historyMoves(): Locator {
    return this.root().getByTestId('move-history').getByTestId('history-move');
  }

  keepProgressButton(): Locator {
    return this.resetDialog().getByTestId('keep-progress');
  }

  confirmResetButton(): Locator {
    return this.resetDialog().getByTestId('confirm-reset-progress');
  }

  resetProgressButton(): Locator {
    return this.root().getByTestId('reset-progress');
  }

  async openPractice(): Promise<void> {
    await this.open();
    await this.selectCollection('lichess-practice');
    await this.selectExercise(1);
    await expect(this.board.square('a2')).toHaveAttribute('aria-label', 'a2 White bishop');
  }

  protected override async waitUntilReady(): Promise<void> {
    await expect(this.heading()).toBeVisible();
    await expect(this.board.squares()).toHaveCount(64);
  }

  async selectCollection(collection: Collection): Promise<void> {
    await this.collection().selectOption(collection);
  }

  async selectExercise(id: number): Promise<void> {
    await this.exercise().selectOption(String(id));
  }

  async selectChapter(stage: number, chapter: string): Promise<void> {
    await this.root().getByTestId('chapter-select').selectOption(`${stage}|${chapter}`);
  }

  exerciseOption(id: number): Locator {
    return this.exercise().getByTestId(`exercise-option-${id}`);
  }

  historyMove(index: number): Locator {
    return this.historyMoves().nth(index);
  }

  async nextExercise(): Promise<void> {
    await this.nextExerciseButton().click();
  }

  async previousExercise(): Promise<void> {
    await this.previousExerciseButton().click();
  }

  async requestHint(): Promise<void> {
    await this.hintButton().click();
  }

  async revealSolution(): Promise<void> {
    await this.root().getByTestId('show-solution').click();
  }

  async playNextMove(): Promise<void> {
    await this.playNextMoveButton().click();
  }

  async retryExercise(): Promise<void> {
    await this.root().getByTestId('retry-exercise').click();
  }

  async requestProgressReset(): Promise<void> {
    await this.resetProgressButton().click();
  }

  async cancelProgressReset(): Promise<void> {
    await this.keepProgressButton().click();
  }

  async confirmProgressReset(): Promise<void> {
    await this.confirmResetButton().click();
  }

  async selectBoardTheme(theme: BoardTheme): Promise<void> {
    await this.boardTheme().selectOption(theme);
  }

  async toggleAppearance(): Promise<void> {
    await this.appearanceToggle().click();
  }

  async importStudyPack(pack: PuzzlePack): Promise<void> {
    await this.importStudyJSON(JSON.stringify(pack));
  }

  async importStudyJSON(raw: string): Promise<void> {
    await this.root()
      .getByTestId('import-pack')
      .setInputFiles({
        name: 'test-pack.json',
        mimeType: 'application/json',
        buffer: Buffer.from(raw),
      });
  }

  async flipBoard(): Promise<void> {
    await this.root().getByTestId('flip-board').click();
  }

  async enterBoardFromHeader(): Promise<void> {
    const toggle = this.appearanceToggle();
    await toggle.focus();
    await toggle.press('Tab');
  }

  async pressDialogKey(key: 'Tab' | 'Shift+Tab' | 'Escape' | 'Enter'): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async appearanceColors(): Promise<{ app: string; square: string }> {
    const [app, square] = await Promise.all([
      this.root().evaluate((element) => getComputedStyle(element).backgroundColor),
      this.board.square('a1').evaluate((element) => getComputedStyle(element).backgroundColor),
    ]);
    return { app, square };
  }

  async horizontalOverflow(): Promise<number> {
    return this.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  }
}
