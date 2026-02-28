import { defineConfig } from "eslint/config";
import tsParser from "@typescript-eslint/parser";

/**
 * Gedeelde ESLint regels voor het Oranje Wit monorepo.
 * Apps importeren `sharedRules` in hun eigen eslint.config.mjs.
 */
export const sharedRules = {
  // Console.log blokkeren — gebruik logger uit @oranje-wit/types
  "no-console": ["error", { allow: ["warn", "error"] }],

  // Ongebruikte variabelen (underscore-prefix mag)
  "@typescript-eslint/no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],

  // Geen lege catch-blocks
  "no-empty": ["error", { allowEmptyCatch: false }],

  // Prefer const
  "prefer-const": "error",

  // Max bestandsgrootte als hint (niet blocking)
  "max-lines": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],
};

/**
 * Root config voor lint-staged pre-commit checks.
 * Apps hebben ook eigen eslint.config.mjs met Next.js-specifieke regels,
 * maar lint-staged draait vanuit de root en gebruikt deze config.
 */
export default defineConfig([
  {
    files: ["packages/*/src/**/*.{ts,tsx}", "apps/*/src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-console": sharedRules["no-console"],
      "no-empty": sharedRules["no-empty"],
      "prefer-const": sharedRules["prefer-const"],
      "max-lines": sharedRules["max-lines"],
    },
  },
]);
