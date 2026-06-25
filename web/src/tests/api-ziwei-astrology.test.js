import { describe, it, expect, beforeEach, vi } from 'vitest';
import api from '../services/api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('getAIZiweiInterpretation branches', () => {
  beforeEach(() => {
    localStorage.removeItem('minimax_api_key');
    localStorage.setItem('ai_provider', 'minimax');
    mockFetch.mockReset();
  });

  describe('API Key validation branches', () => {
    it('should throw when no API key is configured', async () => {
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('请先在设置中配置 MiniMax API Key');
    });

    it('should throw when API key format is invalid (not sk- or eyJ)', async () => {
      localStorage.setItem('minimax_api_key', 'invalid-key-format');
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('API Key 格式无效，请检查设置');
    });
  });

  describe('Network error branches', () => {
    it('should throw network error when fetch fails', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockRejectedValue(new Error('Network failure'));
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('网络连接失败，请检查网络后重试');
    });
  });

  describe('HTTP error branches', () => {
    it('should handle 401 error', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ base_resp: { status_msg: 'Unauthorized' } })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('MiniMax API Key 无效或已过期，请检查设置');
    });

    it('should handle 403 error', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ base_resp: { status_msg: 'Forbidden' } })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('API Key 权限不足');
    });

    it('should handle 429 error', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ base_resp: { status_msg: 'Rate limited' } })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('请求过于频繁，请稍后重试');
    });

    it('should handle 500 error', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({})
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('MiniMax 服务器繁忙，请稍后重试');
    });

    it('should use error body message when available', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ base_resp: { status_msg: 'Custom error message' } })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('Custom error message');
    });
  });

  describe('Response parsing branches', () => {
    it('should throw when JSON parsing fails', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('服务器响应格式错误，请稍后重试');
    });

    it('should throw when API returns base_resp with error status', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          base_resp: { status_code: 1001, status_msg: 'API Error' }
        })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('API Error');
    });

    it('should throw when choices is missing', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ base_resp: { status_code: 0 } })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('AI 响应格式错误，请稍后重试');
    });

    it('should throw when choices is empty array', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ base_resp: { status_code: 0 }, choices: [] })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('AI 响应格式错误，请稍后重试');
    });

    it('should throw when choice has no finish_reason and no messages', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ base_resp: { status_code: 0 }, choices: [{}] })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('AI 响应格式错误，请稍后重试');
    });

    it('should throw when content extraction fails (no recognized field)', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          base_resp: { status_code: 0 },
          // No recognized content field - causes _extractAIContent to throw
          choices: [{ finish_reason: 'stop', message: { unknown_field: 'value' } }]
        })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('AI 响应内容解析失败');
    });

    it('should throw when AI returns whitespace-only content', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          base_resp: { status_code: 0 },
          choices: [{ finish_reason: 'stop', message: { content: '   ' } }]
        })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      await expect(getAIZiweiInterpretation(birthData)).rejects.toThrow('AI 暂时无法提供解读，请稍后重试');
    });
  });

  describe('Successful response branches', () => {
    it('should return content from message.content', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          base_resp: { status_code: 0 },
          choices: [{ finish_reason: 'stop', message: { content: '分析结果内容' } }]
        })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      const result = await getAIZiweiInterpretation(birthData);
      expect(result).toBe('分析结果内容');
    });

    it('should return content from messages array', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          base_resp: { status_code: 0 },
          choices: [{
            finish_reason: 'stop',
            messages: [
              { role: 'user', content: 'Hello' },
              { role: 'assistant', content: '分析结果' }
            ]
          }]
        })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh'
      };
      const result = await getAIZiweiInterpretation(birthData);
      expect(result).toBe('分析结果');
    });

    it('should use ziweiData when provided', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          base_resp: { status_code: 0 },
          choices: [{ finish_reason: 'stop', message: { content: '命盘分析结果' } }]
        })
      });
      const { getAIZiweiInterpretation } = api;
      const birthData = {
        birthday: '1990-01-01',
        birthTime: '子时',
        gender: 'male',
        birthdayType: 'solar',
        language: 'zh',
        ziweiData: '紫微斗数详细数据...'
      };
      const result = await getAIZiweiInterpretation(birthData);
      expect(result).toBe('命盘分析结果');
      // Verify the request was made
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});

describe('getAIAstrologyInterpretation branches', () => {
  beforeEach(() => {
    localStorage.removeItem('minimax_api_key');
    localStorage.setItem('ai_provider', 'minimax');
    mockFetch.mockReset();
  });

  describe('API Key validation', () => {
    it('should throw when no API key is configured', async () => {
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      await expect(getAIAstrologyInterpretation(chartData)).rejects.toThrow('请先在设置中配置 MiniMax API Key');
    });
  });

  describe('Network error branches', () => {
    it('should throw network error when fetch fails', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockRejectedValue(new Error('Network failure'));
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      await expect(getAIAstrologyInterpretation(chartData)).rejects.toThrow('网络连接失败，请检查网络后重试');
    });
  });

  describe('HTTP error branches', () => {
    it('should handle 401 error', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({})
      });
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      await expect(getAIAstrologyInterpretation(chartData)).rejects.toThrow('MiniMax API Key 无效或已过期，请检查设置');
    });

    it('should handle 500 error', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({})
      });
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      await expect(getAIAstrologyInterpretation(chartData)).rejects.toThrow('MiniMax 服务器繁忙，请稍后重试');
    });

    it('should use error body message when available', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ base_resp: { status_msg: '星盘API错误' } })
      });
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      await expect(getAIAstrologyInterpretation(chartData)).rejects.toThrow('星盘API错误');
    });
  });

  describe('Response parsing branches', () => {
    it('should throw when choices is missing', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      await expect(getAIAstrologyInterpretation(chartData)).rejects.toThrow('AI 响应格式错误，请稍后重试');
    });

    it('should throw when choices is empty array', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [] })
      });
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      await expect(getAIAstrologyInterpretation(chartData)).rejects.toThrow('AI 响应格式错误，请稍后重试');
    });

    it('should throw when AI returns empty content', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ finish_reason: 'stop', message: { content: '   ' } }]
        })
      });
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      await expect(getAIAstrologyInterpretation(chartData)).rejects.toThrow('AI 暂时无法提供解读，请稍后重试');
    });
  });

  describe('Successful response branches', () => {
    it('should return content from message.content', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ finish_reason: 'stop', message: { content: '星盘分析结果' } }]
        })
      });
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      const result = await getAIAstrologyInterpretation(chartData);
      expect(result).toBe('星盘分析结果');
    });

    it('should handle English language parameter', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ finish_reason: 'stop', message: { content: 'Chart analysis result' } }]
        })
      });
      const { getAIAstrologyInterpretation } = api;
      const chartData = {
        planets: [{ id: 'sun', name: 'Sun', sign: { name: 'Leo' }, degree: 120 }],
        ascendant: { sign: { name: 'Aries' }, degree: 30 },
        midheaven: { sign: { name: 'Capricorn' } },
        birthData: { year: 1990, month: 1, day: 1, hour: 12, minute: 0 }
      };
      const result = await getAIAstrologyInterpretation(chartData, 'en');
      expect(result).toBe('Chart analysis result');
    });
  });
});
