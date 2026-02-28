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
