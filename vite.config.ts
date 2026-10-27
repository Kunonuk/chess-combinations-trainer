import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { appBasePath } from "./app.config.ts";
export default defineConfig({
  base: appBasePath,
  plugins: [react()],
  build: { target: "es2022" },
});
