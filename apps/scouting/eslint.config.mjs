import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { sharedRules } from "../../eslint.config.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      ...sharedRules,
      // Prisma gegenereerde types veroorzaken TS2321 stack depth — as any is hier bewust
      "@typescript-eslint/no-explicit-any": "off",
      // setState in useEffect is correct patroon voor data-fetching en localStorage init
      "react-hooks/set-state-in-effect": "off",
      // React Compiler memoization hints conflicteren met handmatige useCallback patterns
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
]);

export default eslintConfig;
