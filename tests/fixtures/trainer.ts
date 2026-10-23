import { expect, test as base, type ConsoleMessage } from '@playwright/test';
import { TrainerPage } from '../pages/TrainerPage.ts';

interface TrainerFixtures {
  trainer: TrainerPage;
  practice: TrainerPage;
  browserErrors: string[];
}

export const test = base.extend<TrainerFixtures>({
  trainer: async ({ page, hasTouch }, use) => {
    await use(new TrainerPage(page, hasTouch));
  },
  practice: async ({ trainer }, use) => {
    await trainer.openPractice();
    await use(trainer);
  },
  browserErrors: [
    async ({ page }, use, testInfo) => {
      const errors: string[] = [];
      const onPageError = (error: Error) => errors.push(error.message);
      const onConsole = (message: ConsoleMessage) => {
        if (message.type() === 'error') errors.push(message.text());
      };
      page.on('pageerror', onPageError);
      page.on('console', onConsole);
      try {
        await use(errors);
      } finally {
        page.off('pageerror', onPageError);
        page.off('console', onConsole);
        if (errors.length) {
          await testInfo.attach('browser-errors', {
            body: errors.join('\n'),
            contentType: 'text/plain',
          });
        }
        expect(errors, 'No uncaught browser or console errors').toEqual([]);
      }
    },
    { auto: true },
  ],
});

export { expect };
