import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// 每次测试后清理
afterEach(() => {
  cleanup();
});

// 全局 expect 扩展
globalThis.expect = expect;

// Vite 注入的全局变量
globalThis.__APP_VERSION__ = '2.9.0';
globalThis.__GIT_SHA__ = 'test1234';