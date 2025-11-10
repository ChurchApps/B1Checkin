const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const unusedImports = require('eslint-plugin-unused-imports');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', '.expo/**', 'android/**', 'ios/**'],
  },
  ...compat.extends('@react-native-community', 'eslint-config-expo'),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'unused-imports': unusedImports,
    },
    rules: {
      // Disable all prettier rules
      'prettier/prettier': 'off',

      // Basic syntax preferences
      'comma-dangle': 'off',
      'radix': 0,
      'eol-last': ['warn', 'always'],
      'quote-props': ['error', 'as-needed'],
      'quotes': [2, 'double', { avoidEscape: true }],
      'no-trailing-spaces': 'warn',
      'no-var': 'error',
      'no-multiple-empty-lines': 'off',
      'no-useless-escape': 0,
      'jsx-quotes': ['warn', 'prefer-double'],
      'semi': ['error', 'always'],
      'comma-spacing': ['error', { before: false, after: true }],

      // TypeScript specific
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // Unused imports
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],

      // React Native specific
      'react-native/no-inline-styles': 0,

      // Indentation and spacing
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'arrow-body-style': ['warn', 'as-needed'],
      'react/jsx-tag-spacing': ['warn', { beforeSelfClosing: 'always', beforeClosing: 'never' }],

      // Line length - very permissive
      'max-len': ['warn', {
        code: 300,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
        ignoreUrls: true,
        ignoreRegExpLiterals: true,
        ignorePattern: '^import\\s.+\\sfrom\\s.+;$|^export\\s.+\\sfrom\\s.+;$'
      }],

      // Compact code formatting
      'curly': ['error', 'multi-line'],
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'nonblock-statement-body-position': ['error', 'beside'],

      // Object and array formatting - prefer single line
      'object-curly-spacing': ['error', 'always'],
      'object-curly-newline': ['error', {
        ObjectExpression: { multiline: true, minProperties: 8, consistent: true },
        ObjectPattern: { multiline: true, minProperties: 8, consistent: true },
        ImportDeclaration: { multiline: true, minProperties: 8, consistent: true },
        ExportDeclaration: { multiline: true, minProperties: 8, consistent: true }
      }],
      'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
      'array-bracket-spacing': ['error', 'never'],
      'array-bracket-newline': ['error', { multiline: true, minItems: 10 }],
      'array-element-newline': ['error', { multiline: true, minItems: 10 }],

      // Function formatting - prefer single line
      'function-paren-newline': ['error', 'multiline-arguments'],
      'function-call-argument-newline': ['error', 'consistent'],

      // JSX formatting - prefer single line
      'react/jsx-max-props-per-line': 'off',
      'react/jsx-first-prop-new-line': 'off',
      'react/jsx-closing-bracket-location': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/jsx-wrap-multilines': 'off',
      'react/jsx-props-no-multi-spaces': 'off',

      // Operator positioning
      'operator-linebreak': 'off',
      'multiline-ternary': 'off',

      // Block formatting
      'block-spacing': ['error', 'always'],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-before-blocks': ['error', 'always'],

      // Disable rules that force wrapping
      'newline-per-chained-call': 'off',
      'no-mixed-operators': 'off',
      'wrap-regex': 'off',

      // Disable problematic rules from @react-native-community
      '@typescript-eslint/func-call-spacing': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'react-native/no-unused-styles': 'off',
      'react/display-name': 'off',
      'react/react-in-jsx-scope': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'import/namespace': 'off',
    },
  },
];
