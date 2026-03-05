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
      // setState in useEffect is het correcte patroon voor formulier-reset op prop-wijziging
      "react-hooks/set-state-in-effect": "off",
      // Ref-access in d3 event handlers is geen React render — false positive
      "react-hooks/refs": "off",
      // Prisma gegenereerde types veroorzaken TS2321 stack depth — as any is hier bewust
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
