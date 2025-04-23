module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier", // Must be last
    "turbo", // Optional
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // Add custom rules here if needed
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }], // Example rule
  },
  ignorePatterns: ["*.js", "dist/", "build/", "node_modules/"], // Adjust as needed
};
