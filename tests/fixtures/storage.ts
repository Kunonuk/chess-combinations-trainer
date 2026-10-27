import { PROGRESS_KEY } from "../../src/services/progress.ts";
import { test as base } from "./trainer.ts";

export type StorageScenario =
  "available" | "corrupt-progress" | "read-denied" | "write-denied";

interface StorageFixtures {
  storageScenario: StorageScenario;
  storageBoundary: void;
}

export const test = base.extend<StorageFixtures>({
  storageScenario: ["available", { option: true }],
  storageBoundary: [
    async ({ context, baseURL, storageScenario }, use) => {
      if (!baseURL)
        throw new Error(
          "Storage scenarios require a configured Playwright baseURL.",
        );
      await context.addInitScript(
        ({ origin, scenario, progressKey }) => {
          if (window.location.origin !== origin) return;
          const storage = window.localStorage;
          if (scenario === "corrupt-progress") {
            // Reloads must see any valid progress subsequently saved by the application.
            if (storage.getItem(progressKey) === null)
              storage.setItem(progressKey, "{");
          } else if (scenario === "read-denied") {
            // eslint-disable-next-line @typescript-eslint/unbound-method -- call below supplies the native Storage receiver.
            const read = Storage.prototype.getItem;
            Storage.prototype.getItem = function (key: string): string | null {
              if (this === storage)
                throw new window.DOMException(
                  "Storage read denied",
                  "SecurityError",
                );
              return read.call(this, key);
            };
          } else if (scenario === "write-denied") {
            // eslint-disable-next-line @typescript-eslint/unbound-method -- call below supplies the native Storage receiver.
            const write = Storage.prototype.setItem;
            Storage.prototype.setItem = function (
              key: string,
              value: string,
            ): void {
              if (this === storage)
                throw new window.DOMException(
                  "Storage write denied",
                  "QuotaExceededError",
                );
              write.call(this, key, value);
            };
          }
        },
        {
          origin: new URL(baseURL).origin,
          scenario: storageScenario,
          progressKey: PROGRESS_KEY,
        },
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect } from "./trainer.ts";
