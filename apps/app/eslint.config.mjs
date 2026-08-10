import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Warn, not error.
      //
      // Every current violation is the same shape: `useEffect(() => { load(); }, [])`
      // where `load` is an async function that setStates after awaiting a fetch — the
      // canonical fetch-on-mount effect, used consistently across the admin and account
      // pages. The rule can't see through the await, so it reads a synchronous setState
      // that isn't there.
      //
      // Kept on as a warning rather than switched off, because the genuine version of
      // this — setState directly in an effect body, which does cascade renders — is a
      // real bug worth seeing. One was found and fixed that way in
      // components/assessment/bmi-field.tsx, by adjusting state during render instead.
      //
      // What these effects DO lack is cancellation: an unmount mid-fetch still calls
      // setState. Harmless on React 18+, but the reason to revisit them properly rather
      // than treat this downgrade as the end of the matter.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
