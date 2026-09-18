import { describe, it, expect } from 'vitest';
import { commitTimeSuffix, formatBeijingTime, shortSha } from '../../utils/commitInfo';

describe('formatBeijingTime（提交时间 → 北京时间）', () => {
  it.each([
    ['2026-09-18T12:00:00Z', '2026-09-18 20:00'], // 标准 +8
    ['2026-09-18T16:30:00Z', '2026-09-19 00:30'], // 跨日进位
    ['2026-09-18T20:00:00+08:00', '2026-09-18 20:00'], // 输入本身带 +08:00
    ['2026-01-01T00:00:00Z', '2026-01-01 08:00'], // 年初
  ])('%s → %s', (iso, expected) => {
    expect(formatBeijingTime(iso)).toBe(expected);
  });

  it.each([
    ['', '空字符串'],
    [undefined, '未注入（本地未构建时）'],
    ['not-a-date', '非法 ISO'],
  ])('无效输入 %s（%s）返回空串', (iso) => {
    expect(formatBeijingTime(iso)).toBe('');
  });
});

describe('commitTimeSuffix（footer 后缀）', () => {
  it.each([
    ['zh', ' · 2026-09-18 20:00（北京时间）'],
    ['en', ' · 2026-09-18 20:00 (Beijing time)'],
    ['zh-TW', ' · 2026-09-18 20:00（北京时间）'], // 非 en 一律中文
  ])('%s → %s', (language, expected) => {
    expect(commitTimeSuffix('2026-09-18T12:00:00Z', language)).toBe(expected);
  });

  it('没有有效时间时不追加任何后缀', () => {
    expect(commitTimeSuffix('', 'zh')).toBe('');
    expect(commitTimeSuffix('bad', 'en')).toBe('');
  });
});

describe('shortSha', () => {
  it.each([
    ['d836a1fcb2670ccda5842aa21887b39bd3fe90e1', 'd836a1fc'],
    ['test1234', 'test1234'],
    ['local', 'local'],
    ['', 'local'],
    [undefined, 'local'],
  ])('%s → %s', (sha, expected) => {
    expect(shortSha(sha)).toBe(expected);
  });
});
