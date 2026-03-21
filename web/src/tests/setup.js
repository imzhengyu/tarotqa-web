import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// 每次测试后清理
afterEach(() => {
  cleanup();
});

// 全局 expect 扩展
globalThis.expect = expect;