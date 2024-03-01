module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "no-undef": "off",
    quotes: ["error", "double", { avoidEscape: true }],
    semi: ["error", "always"],
    "quote-props": ["error", "as-needed"],
    "prefer-const": "error",
    "no-var": "error",
    "no-async-promise-executor": "off",
    "@typescript-eslint/array-type": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/consistent-type-assertions": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-explicit-any": "off",
  },
};
