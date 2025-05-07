import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier"; // Import prettier config

// Import the custom config's settings manually for now
// In a real scenario, consider converting the custom config to ESM
// or using a tool to bridge CJS/ESM configs.
const customConfigRules = {
  "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
};

export default tseslint.config(
  // Global ignores based on checklist V.9 and Vite defaults
  {
    ignores: [
      "dist/",
      "node_modules/",
      "build/", // Added from custom config ignore
      "eslint.config.js", // Keep ignoring this config file
      "vite.config.ts", // Added from checklist V.9
      "codegen.ts", // Added from checklist V.9
      // Note: Checklist also ignored '*.js', which might be too broad.
      // Keep specific config files ignored.
    ],
  },

  // Base configurations (similar to extends)
  tseslint.configs.base, // Basic TS setup
  tseslint.configs.eslintRecommended, // eslint:recommended equivalent
  tseslint.configs.recommended, // @typescript-eslint/recommended equivalent

  // Configuration for TS/TSX files (main app code)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module", // Added from custom config parserOptions
      globals: {
        ...globals.browser, // browser env
        ...globals.es2020, // es2020 env
      },
      // Use the TS parser
      parser: tseslint.parser,
      parserOptions: {
        project: true, // Assuming project references are set up in tsconfig
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Rules from custom config (translated)
      ...customConfigRules,

      // Rules from Vite default template
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Specific rules from checklist V.9
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",

      // TODO: Add any other project-specific rules here
    },
    // React settings from checklist V.9 (approximated in flat config)
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // Apply Prettier config last to override other formatting rules
  eslintConfigPrettier
);
