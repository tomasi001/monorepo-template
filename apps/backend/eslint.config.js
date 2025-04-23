import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

// Mimic rules/settings from @packages/eslint-config-custom/index.js
// and apps/backend/.eslintrc.js
const customConfigRules = {
  "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
};

export default tseslint.config(
  // Global ignores from .eslintrc.js and standard ones
  {
    ignores: [
      "dist/",
      "node_modules/",
      "src/generated/**",
      "eslint.config.js", // Ignore this config file itself
      "codegen.ts", // Ignore codegen script
    ],
  },

  // Base configurations (mimicking extends)
  tseslint.configs.base,
  tseslint.configs.eslintRecommended, // eslint:recommended
  tseslint.configs.recommended, // @typescript-eslint/recommended

  // Configuration for TS files
  {
    files: ["**/*.ts"], // Apply only to TS files
    languageOptions: {
      ecmaVersion: "latest", // From custom config
      sourceType: "module", // From custom config
      globals: {
        ...globals.node, // node env from custom config
        ...globals.es2022, // es2022 env from custom config (use latest es globals)
      },
      parser: tseslint.parser,
      parserOptions: {
        project: true, // Assumes tsconfig.json is set up for ESLint
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...customConfigRules,
      // Add any backend-specific rules here if needed
    },
  },

  // Apply Prettier config last (mimicking "prettier" in extends)
  eslintConfigPrettier
);
