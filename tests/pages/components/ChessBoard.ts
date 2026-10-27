import { expect, type Locator, type Page } from "@playwright/test";
import type { Square } from "chess.js";

export type BoardOrientation = "white" | "black";
export type PromotionPiece = "q" | "r" | "b" | "n";

export class ChessBoard {
  constructor(
    private readonly page: Page,
    private readonly hasTouch: boolean,
  ) {}

  root(): Locator {
    return this.page.getByTestId("chessboard");
  }

  squares(): Locator {
    return this.root().getByTestId(/^square-[a-h][1-8]$/);
  }

  promotionDialog(): Locator {
    return this.page.getByTestId("promotion-dialog");
  }

  promotionCancel(): Locator {
    return this.promotionDialog().getByTestId("cancel-promotion");
  }

  square(square: Square): Locator {
    return this.root().getByTestId(`square-${square}`);
  }

  async move(from: Square, to: Square): Promise<void> {
    for (const square of [from, to]) {
      const target = this.square(square);
      if (this.hasTouch) await target.tap();
      else await target.click();
    }
  }

  async playMove(uci: string): Promise<void> {
    const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/.exec(uci);
    if (!match) throw new Error(`Invalid UCI move: ${uci}`);
    await this.move(match[1] as Square, match[2] as Square);
    const promotion = match[3];
    if (promotion) {
      await this.choosePromotion(promotion as PromotionPiece);
    }
  }

  promotionOption(piece: PromotionPiece): Locator {
    return this.promotionDialog().getByTestId(`promote-${piece}`);
  }

  async choosePromotion(piece: PromotionPiece): Promise<void> {
    await this.promotionOption(piece).click();
  }

  async cancelPromotion(): Promise<void> {
    await this.promotionCancel().click();
  }

  async moveByDrag(from: Square, to: Square): Promise<void> {
    await this.root().scrollIntoViewIfNeeded();
    await expect(this.square(from)).toBeVisible();
    await expect(this.square(to)).toBeVisible();
    const start = await this.square(from).boundingBox();
    const end = await this.square(to).boundingBox();
    if (!start || !end)
      throw new Error(
        `Cannot drag from ${from} to ${to}: square is not rendered`,
      );
    await this.page.mouse.move(
      start.x + start.width / 2,
      start.y + start.height / 2,
    );
    await this.page.mouse.down();
    try {
      await this.page.mouse.move(
        end.x + end.width / 2,
        end.y + end.height / 2,
        { steps: 8 },
      );
    } finally {
      await this.page.mouse.up();
    }
  }

  async dragOutsideBoard(from: Square): Promise<void> {
    await this.root().scrollIntoViewIfNeeded();
    await expect(this.square(from)).toBeVisible();
    const start = await this.square(from).boundingBox();
    const board = await this.root().boundingBox();
    if (!start || !board)
      throw new Error(`Cannot drag ${from}: board is not rendered`);
    await this.page.mouse.move(
      start.x + start.width / 2,
      start.y + start.height / 2,
    );
    await this.page.mouse.down();
    try {
      await this.page.mouse.move(board.x + board.width / 2, board.y - 10, {
        steps: 8,
      });
    } finally {
      await this.page.mouse.up();
    }
  }

  async navigateFocus(
    from: Square,
    to: Square,
    orientation: BoardOrientation = "white",
  ): Promise<void> {
    await expect(this.square(from)).toBeFocused();
    const fileDistance = to.charCodeAt(0) - from.charCodeAt(0);
    const rankDistance = Number(to.charAt(1)) - Number(from.charAt(1));
    const direction = orientation === "white" ? 1 : -1;
    const horizontal =
      fileDistance * direction > 0 ? "ArrowRight" : "ArrowLeft";
    const vertical = rankDistance * direction > 0 ? "ArrowUp" : "ArrowDown";
    for (let step = 0; step < Math.abs(fileDistance); step++)
      await this.page.keyboard.press(horizontal);
    for (let step = 0; step < Math.abs(rankDistance); step++)
      await this.page.keyboard.press(vertical);
    await expect(this.square(to)).toBeFocused();
  }

  async moveByKeyboard(
    from: Square,
    to: Square,
    orientation: BoardOrientation = "white",
  ): Promise<void> {
    await expect(this.square(from)).toBeFocused();
    await this.page.keyboard.press("Enter");
    await this.navigateFocus(from, to, orientation);
    await this.page.keyboard.press("Enter");
  }

  async cancelKeyboardSelection(): Promise<void> {
    await this.page.keyboard.press("Escape");
  }

  async selectFocusedSquare(): Promise<void> {
    await this.page.keyboard.press("Enter");
  }

  async position(): Promise<string[]> {
    return this.squares().evaluateAll((cells) =>
      cells.map((cell) => cell.getAttribute("aria-label") ?? ""),
    );
  }

  async hintedSquares(): Promise<string[]> {
    return this.squares().evaluateAll((cells) =>
      cells
        .filter((cell) => cell.getAttribute("data-hint") === "true")
        .map((cell) => cell.getAttribute("data-square") ?? ""),
    );
  }
}
