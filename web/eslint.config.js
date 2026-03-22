import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

const browserGlobals = {
  alert: 'readonly',
  blur: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  close: 'readonly',
  closed: 'readonly',
  confirm: 'readonly',
  console: 'readonly',
  defaultStatus: 'readonly',
  document: 'readonly',
  event: 'readonly',
  focus: 'readonly',
  frames: 'readonly',
  getComputedStyle: 'readonly',
  history: 'readonly',
  innerHeight: 'readonly',
  innerWidth: 'readonly',
  length: 'readonly',
  localStorage: 'readonly',
  location: 'readonly',
  fetch: 'readonly',
  matchMedia: 'readonly',
  moveBy: 'readonly',
  moveTo: 'readonly',
  name: 'readonly',
  navigator: 'readonly',
  open: 'readonly',
  opener: 'readonly',
  parent: 'readonly',
  print: 'readonly',
  prompt: 'readonly',
  resizeBy: 'readonly',
  resizeTo: 'readonly',
  screen: 'readonly',
  screenLeft: 'readonly',
  screenTop: 'readonly',
  screenX: 'readonly',
  screenY: 'readonly',
  scroll: 'readonly',
  scrollBy: 'readonly',
  scrollLeft: 'readonly',
  scrollTo: 'readonly',
  scrollTop: 'readonly',
  scrollX: 'readonly',
  scrollY: 'readonly',
  self: 'readonly',
  sessionStorage: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  status: 'readonly',
  top: 'readonly',
  URL: 'readonly',
  window: 'readonly',
  IntersectionObserver: 'readonly'
};

const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  vi: 'readonly',
  global: 'readonly'
};

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...browserGlobals,
        importMeta: 'readonly',
        __APP_VERSION__: 'readonly',
        __GIT_SHA__: 'readonly'
      }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,

      // React rules
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      // JSX a11y rules
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/html-has-lang': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',

      // General good practices
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off'
    }
  },
  {
    files: ['src/tests/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...browserGlobals,
        ...vitestGlobals,
        importMeta: 'readonly'
      }
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off'
    }
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '*.config.js'
    ]
  }
];
