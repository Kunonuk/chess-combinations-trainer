import js from "@eslint/js";
import prettier from "eslint-config-prettier/flat";
import playwright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "src/data/private/**",
      ".superpowers/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    extends: tseslint.configs.recommendedTypeChecked,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        document: "readonly",
        window: "readonly",
        HTMLElement: "readonly",
        Storage: "readonly",
        FileReader: "readonly",
        File: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        requestAnimationFrame: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
        HTMLInputElement: "readonly",
        HTMLButtonElement: "readonly",
        PointerEvent: "readonly",
      },
    },
  },
  {
    // Shared test infrastructure also contains Vitest helpers; target browser files only.
    files: [
      "tests/e2e/**/*.ts",
      "tests/pages/**/*.ts",
      "tests/fixtures/{trainer,storage}.ts",
      "tests/support/{boardAssertions,routes}.ts",
    ],
    extends: [playwright.configs["flat/recommended"]],
    settings: {
      playwright: { globalAliases: { test: ["base"] } },
    },
  },
  prettier,
);
