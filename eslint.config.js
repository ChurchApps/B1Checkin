const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const unusedImports = require("eslint-plugin-unused-imports");
const reactPlugin = require("eslint-plugin-react");
const reactNativePlugin = require("eslint-plugin-react-native");
const reactHooksPlugin = require("eslint-plugin-react-hooks");

module.exports = [
  { ignores: ["node_modules/", "dist/", "build/", ".next/", "coverage/", "*.config.js", ".expo/", "android/", "ios/"] },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "unused-imports": unusedImports,
      "react": reactPlugin,
      "react-native": reactNativePlugin,
      "react-hooks": reactHooksPlugin
    },
    settings: {
      react: { version: "detect" }
    },
    rules: {
      // --- Code quality ---
      "prefer-const": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        args: "all",
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "unused-imports/no-unused-imports": "error",

      // --- Formatting (ESLint is the sole formatter — no Prettier) ---
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
      "quotes": ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "never"],
      "indent": ["warn", 2, { SwitchCase: 1 }],
      "comma-spacing": ["error", { before: false, after: true }],
      "key-spacing": ["error", { beforeColon: false, afterColon: true, mode: "strict" }],
      "keyword-spacing": ["error", { before: true, after: true }],
      "space-infix-ops": "error",
      "no-multi-spaces": ["error", { ignoreEOLComments: true }],
      "block-spacing": ["error", "always"],

      // --- Compact / single-line formatting ---
      "brace-style": ["error", "1tbs", { allowSingleLine: true }],
      curly: ["error", "multi-line"],
      "nonblock-statement-body-position": ["error", "beside"],

      // Objects
      "object-curly-spacing": ["error", "always"],
      "object-curly-newline": ["error", {
        ObjectExpression: { multiline: true },
        ObjectPattern: { multiline: true },
        ImportDeclaration: { multiline: true },
        ExportDeclaration: { multiline: true }
      }],
      "object-property-newline": ["error", { allowAllPropertiesOnSameLine: true }],

      // Arrays
      "array-bracket-spacing": ["error", "never"],
      "array-bracket-newline": ["error", { multiline: true, minItems: 8 }],
      "array-element-newline": ["error", { ArrayExpression: "consistent", ArrayPattern: { minItems: 8 } }],

      // Functions
      "function-paren-newline": ["error", "consistent"],
      "function-call-argument-newline": ["error", "consistent"],

      // Generous line length
      "max-len": ["warn", {
        code: 250,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
        ignoreUrls: true,
        ignoreRegExpLiterals: true
      }],

      // --- React Native specific ---
      "react-native/no-inline-styles": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/react-in-jsx-scope": "off",
      "react/display-name": "off"
    }
  }
];
