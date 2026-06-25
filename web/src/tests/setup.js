import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SETUP_DIR = dirname(fileURLToPath(import.meta.url));
const tarotDataRaw = JSON.parse(readFileSync(resolve(SETUP_DIR, '../../../resources/tarot-data.json'), 'utf-8'));

// 每次测试后清理
afterEach(() => {
  cleanup();
});

// 过滤 React Router v7 未来标志警告
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('React Router Future Flag Warning')) return;
  originalWarn.apply(console, args);
};

// 全局 expect 扩展
globalThis.expect = expect;

// Vite 注入的全局变量
globalThis.__APP_VERSION__ = '2.9.0';
globalThis.__GIT_SHA__ = 'test1234';

// localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock html2canvas and jspdf for export functionality tests
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mock'
  }))
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn()
}));

// Stub fetch for tarot-data.json (jsdom has no real network).
// Each call gets a fresh Response-like object to avoid body reuse issues.
globalThis.fetch = vi.fn((url) => {
  if (typeof url === 'string' && url.includes('tarot-data.json')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(tarotDataRaw)
    });
  }
  return Promise.reject(new Error(`fetch not stubbed for ${url}`));
});