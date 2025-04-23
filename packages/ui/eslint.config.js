import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

// Mimic rules from @packages/eslint-config-custom/index.js
const customConfigRules = {
  "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
};

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "dist/",
      "node_modules/",
      "eslint.config.js", // Ignore this config file itself
    ],
  },

  // Base configurations
  tseslint.configs.base,
  tseslint.configs.eslintRecommended,
  tseslint.configs.recommended, // @typescript-eslint/recommended

  // Configuration for TS/TSX files
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest", // Or match your project's target
      sourceType: "module",
      globals: {
        ...globals.browser, // Assuming UI components run in browser
      },
      parser: tseslint.parser,
      parserOptions: {
        project: true, // Assumes tsconfig.json is set up for ESLint
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      // No react-hooks or react-refresh needed usually for a UI library package
    },
    rules: {
      ...customConfigRules,
      // Add any UI package specific rules here if needed
      // Ensure React is available if jsx is used (handled by tsconfig usually)
      "react/react-in-jsx-scope": "off", // Often needed with modern JSX transform
      "react/jsx-uses-react": "off", // Often needed with modern JSX transform
    },
    settings: {
      react: {
        version: "detect", // Detect React version
      },
    },
  },

  // Apply Prettier config last
  eslintConfigPrettier
);
