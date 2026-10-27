import { defineConfig, devices } from "@playwright/test";
import { appBasePath } from "./app.config.ts";

const baseURL = new URL(appBasePath, "http://127.0.0.1:4173").href;

export const webServer = {
  command: "npm run dev -- --port 4173 --strictPort",
  url: baseURL,
  reuseExistingServer: false,
  timeout: 30000,
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer,
});
