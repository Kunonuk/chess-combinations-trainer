import type { Page, Response } from "@playwright/test";

export abstract class BasePage {
  protected constructor(
    protected readonly page: Page,
    private readonly route: string,
  ) {}

  async open(): Promise<Response | null> {
    const response = await this.page.goto(this.route);
    await this.waitUntilReady();
    return response;
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitUntilReady();
  }

  protected abstract waitUntilReady(): Promise<void>;
}
