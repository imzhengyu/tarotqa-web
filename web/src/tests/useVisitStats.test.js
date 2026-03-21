import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateUUID,
  anonymizeIp,
  detectDeviceType,
  detectOSType,
  detectBrowser,
  calculateDeviceStats,
  calculateOsStats,
  getSessionIP,
  loadStats,
  saveStats,
  createInitialStats
} from '../hooks/useVisitStats';

// Mock window properties
const mockWindow = {
  innerWidth: 1024,
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
  },
  screen: {
    width: 1920,
    height: 1080
  }
};

Object.defineProperty(window, 'innerWidth', { get: () => mockWindow.innerWidth, configurable: true });
Object.defineProperty(window, 'navigator', { value: mockWindow.navigator, configurable: true });
Object.defineProperty(window, 'screen', { value: mockWindow.screen, configurable: true });

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock console.error for error handling tests
const consoleErrorMock = vi.fn();
Object.defineProperty(window.console, 'error', {
  value: consoleErrorMock,
  configurable: true
});

// Helper to create mock record
const createMockRecord = (overrides = {}) => ({
  sessionId: 'test-session-1',
  anonymizedIp: '192.168.*.*',
  questionCount: 0,
  firstVisit: new Date().toISOString(),
  lastVisit: new Date().toISOString(),
  deviceType: 'desktop',
  osType: 'Windows',
  browser: 'Chrome',
  ...overrides
});

describe('useVisitStats Utility Functions', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('generateUUID', () => {
    it('应该生成有效的 UUID v4 格式', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('每次生成的 UUID 应该不同', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });

    it('UUID 应该包含正确的版本号 4', () => {
      const uuid = generateUUID();
      expect(uuid.charAt(14)).toBe('4');
    });
  });

  describe('anonymizeIp', () => {
    it('应该正确匿名化有效的 IP 地址', () => {
      const result = anonymizeIp('192.168.1.100');
      expect(result).toBe('192.168.*.*');
    });

    it('应该处理 null 输入', () => {
      const result = anonymizeIp(null);
      expect(result).toBe('unknown');
    });

    it('应该处理空字符串输入', () => {
      const result = anonymizeIp('');
      expect(result).toBe('unknown');
    });

    it('应该处理只有一个段的 IP', () => {
      const result = anonymizeIp('192');
      expect(result).toBe('unknown');
    });

    it('应该处理有两个段的 IP', () => {
      const result = anonymizeIp('192.168');
      expect(result).toBe('192.168.*.*');
    });
  });

  describe('detectDeviceType', () => {
    it('应该检测桌面设备 (width >= 1024)', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 1024, configurable: true });
      expect(detectDeviceType()).toBe('desktop');
    });

    it('应该检测平板设备 (768 <= width < 1024)', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 800, configurable: true });
      expect(detectDeviceType()).toBe('tablet');
    });

    it('应该检测移动设备 (width < 768)', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 375, configurable: true });
      expect(detectDeviceType()).toBe('mobile');
    });

    it('应该处理边界值 768', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 768, configurable: true });
      expect(detectDeviceType()).toBe('tablet');
    });

    it('应该处理边界值 1024', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 1024, configurable: true });
      expect(detectDeviceType()).toBe('desktop');
    });

    it('应该处理边界值 767', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 767, configurable: true });
      expect(detectDeviceType()).toBe('mobile');
    });
  });

  describe('detectOSType', () => {
    it('应该检测 iOS 设备 (iPhone)', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }, configurable: true });
      expect(detectOSType()).toBe('iOS');
    });

    it('应该检测 iOS 设备 (iPad)', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' }, configurable: true });
      expect(detectOSType()).toBe('iOS');
    });

    it('应该检测 Android 设备', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile' }, configurable: true });
      expect(detectOSType()).toBe('Android');
    });

    it('应该检测 Windows NT 10', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0' }, configurable: true });
      expect(detectOSType()).toBe('Windows');
    });

    it('应该检测 macOS (Macintosh)', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36' }, configurable: true });
      expect(detectOSType()).toBe('macOS');
    });

    it('应该检测 macOS (Mac OS X)', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Mac OS X 10_15_7) AppleWebKit/537.36' }, configurable: true });
      expect(detectOSType()).toBe('macOS');
    });

    it('应该检测 Linux', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0' }, configurable: true });
      expect(detectOSType()).toBe('Linux');
    });

    it('应该返回 Other 对于未知 OS', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Unknown/1.0' }, configurable: true });
      expect(detectOSType()).toBe('Other');
    });
  });

  describe('detectBrowser', () => {
    it('应该检测 Chrome 浏览器', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0' }, configurable: true });
      expect(detectBrowser()).toBe('Chrome');
    });

    it('不应该将 Edge 识别为 Chrome', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Edge/120.0.0.0' }, configurable: true });
      expect(detectBrowser()).toBe('Edge');
    });

    it('应该检测 Firefox 浏览器', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0' }, configurable: true });
      expect(detectBrowser()).toBe('Firefox');
    });

    it('应该检测 Safari 浏览器 (非 Chrome)', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15' }, configurable: true });
      expect(detectBrowser()).toBe('Safari');
    });

    it('应该检测 Edge 浏览器', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Edge/120.0.0.0' }, configurable: true });
      expect(detectBrowser()).toBe('Edge');
    });

    it('应该返回 Other 对于未知浏览器', () => {
      Object.defineProperty(window, 'navigator', { value: { userAgent: 'Unknown/1.0' }, configurable: true });
      expect(detectBrowser()).toBe('Other');
    });
  });

  describe('calculateDeviceStats', () => {
    it('应该正确计算设备统计', () => {
      const records = [
        createMockRecord({ deviceType: 'desktop' }),
        createMockRecord({ deviceType: 'desktop' }),
        createMockRecord({ deviceType: 'mobile' }),
        createMockRecord({ deviceType: 'tablet' })
      ];

      const stats = calculateDeviceStats(records);
      expect(stats.desktop).toBe(2);
      expect(stats.mobile).toBe(1);
      expect(stats.tablet).toBe(1);
    });

    it('应该处理空记录列表', () => {
      const stats = calculateDeviceStats([]);
      expect(stats.desktop).toBe(0);
      expect(stats.mobile).toBe(0);
      expect(stats.tablet).toBe(0);
    });

    it('应该处理未知设备类型', () => {
      const records = [
        createMockRecord({ deviceType: 'unknown' })
      ];

      const stats = calculateDeviceStats(records);
      expect(stats.desktop).toBe(0);
      expect(stats.mobile).toBe(0);
      expect(stats.tablet).toBe(0);
    });
  });

  describe('calculateOsStats', () => {
    it('应该正确计算 OS 统计', () => {
      const records = [
        createMockRecord({ osType: 'Windows' }),
        createMockRecord({ osType: 'Windows' }),
        createMockRecord({ osType: 'macOS' }),
        createMockRecord({ osType: 'Android' }),
        createMockRecord({ osType: 'iOS' })
      ];

      const stats = calculateOsStats(records);
      expect(stats.Windows).toBe(2);
      expect(stats.macOS).toBe(1);
      expect(stats.Android).toBe(1);
      expect(stats.iOS).toBe(1);
      expect(stats.Linux).toBe(0);
    });

    it('应该将未知 OS 计入 Other', () => {
      const records = [
        createMockRecord({ osType: 'FreeBSD' })
      ];

      const stats = calculateOsStats(records);
      expect(stats.Other).toBe(1);
    });

    it('应该处理空记录列表', () => {
      const stats = calculateOsStats([]);
      expect(stats.Windows).toBe(0);
      expect(stats.macOS).toBe(0);
      expect(stats.Linux).toBe(0);
      expect(stats.Android).toBe(0);
      expect(stats.iOS).toBe(0);
      expect(stats.Other).toBe(0);
    });
  });

  describe('getSessionIP', () => {
    it('应该返回有效格式的 IP', () => {
      const ip = getSessionIP();
      expect(ip).toMatch(/^\d{1,3}\.\d{1,3}$/);
    });

    it('每次调用应该返回相同的 IP (基于相同的 seed)', () => {
      const ip1 = getSessionIP();
      const ip2 = getSessionIP();
      expect(ip1).toBe(ip2);
    });
  });

  describe('loadStats', () => {
    it('应该从 localStorage 加载统计', () => {
      const testData = {
        version: '1.1',
        records: [createMockRecord()],
        stats: {
          totalSessions: 1,
          totalQuestions: 0,
          deviceStats: { desktop: 1, tablet: 0, mobile: 0 },
          osStats: { Windows: 1, macOS: 0, Linux: 0, Android: 0, iOS: 0, Other: 0 },
          lastUpdated: new Date().toISOString(),
          lastDeviceStatsUpdate: new Date().toISOString()
        }
      };
      localStorage.setItem('tarotqa_visit_stats', JSON.stringify(testData));

      const loaded = loadStats();
      expect(loaded).toEqual(testData);
    });

    it('当 localStorage 没有数据时应该返回 null', () => {
      localStorage.removeItem('tarotqa_visit_stats');
      const loaded = loadStats();
      expect(loaded).toBeNull();
    });
  });

  describe('saveStats', () => {
    it('应该保存统计到 localStorage', () => {
      const testData = {
        version: '1.1',
        records: [],
        stats: {
          totalSessions: 0,
          totalQuestions: 0,
          deviceStats: { desktop: 0, tablet: 0, mobile: 0 },
          osStats: { Windows: 0, macOS: 0, Linux: 0, Android: 0, iOS: 0, Other: 0 },
          lastUpdated: new Date().toISOString(),
          lastDeviceStatsUpdate: new Date().toISOString()
        }
      };

      saveStats(testData);
      const stored = localStorage.getItem('tarotqa_visit_stats');
      expect(JSON.parse(stored)).toEqual(testData);
    });
  });

  describe('createInitialStats', () => {
    it('应该创建正确版本的初始统计', () => {
      const stats = createInitialStats();
      expect(stats.version).toBe('1.1');
    });

    it('应该包含正确的记录结构', () => {
      const stats = createInitialStats();
      expect(stats.records).toEqual([]);
      expect(stats.stats).toBeDefined();
    });

    it('应该包含正确的初始值', () => {
      const stats = createInitialStats();
      expect(stats.stats.totalSessions).toBe(0);
      expect(stats.stats.totalQuestions).toBe(0);
      expect(stats.stats.deviceStats).toEqual({ desktop: 0, tablet: 0, mobile: 0 });
      expect(stats.stats.osStats).toEqual({
        Windows: 0,
        macOS: 0,
        Linux: 0,
        Android: 0,
        iOS: 0,
        Other: 0
      });
    });

    it('应该包含时间戳字段', () => {
      const stats = createInitialStats();
      expect(stats.stats.lastUpdated).toBeDefined();
      expect(stats.stats.lastDeviceStatsUpdate).toBeDefined();
    });
  });

  describe('loadStats Error Handling', () => {
    it('应该处理 JSON.parse 错误', () => {
      // Set corrupted data in localStorage
      localStorage.setItem('tarotqa_visit_stats', 'invalid-json{');

      const result = loadStats();
      expect(result).toBeNull();
      expect(consoleErrorMock).toHaveBeenCalled();
    });

    it('应该处理 localStorage.getItem 抛出异常', () => {
      // Create a localStorage that throws on getItem
      const throwingStorage = {
        getItem: () => { throw new Error('Storage error'); },
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
      };
      Object.defineProperty(window, 'localStorage', { value: throwingStorage, configurable: true });

      const result = loadStats();
      expect(result).toBeNull();
      expect(consoleErrorMock).toHaveBeenCalled();
    });
  });

  describe('saveStats Error Handling', () => {
    it('应该处理 localStorage.setItem 抛出异常', () => {
      // Create a localStorage that throws on setItem
      const throwingStorage = {
        store: {},
        getItem: (key) => this.store[key] || null,
        setItem: () => { throw new Error('Storage error'); },
        removeItem: (key) => { delete this.store[key]; },
        clear: () => { this.store = {}; }
      };
      Object.defineProperty(window, 'localStorage', { value: throwingStorage, configurable: true });

      const testData = createInitialStats();
      // Should not throw, just log error
      saveStats(testData);
      expect(consoleErrorMock).toHaveBeenCalled();
    });
  });
});