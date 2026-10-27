import { defineConfig } from "@playwright/test";
import localConfig, { webServer } from "./playwright.config";

export default defineConfig({
  ...localConfig,
  webServer: {
    ...webServer,
    command: "npm run preview -- --port 4173 --strictPort",
  },
});
