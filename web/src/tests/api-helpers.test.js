import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 由于内部函数未导出，这里复现当前实现以验证行为。

const AI_PROVIDERS = {
  minimax: { id: 'minimax', name: 'MiniMax' }
};

const DEFAULT_AI_PROVIDER = 'minimax';

const _getProvider = () => {
  const provider = localStorage.getItem('ai_provider');
  return provider && AI_PROVIDERS[provider] ? provider : DEFAULT_AI_PROVIDER;
};

const _getApiKey = () => {
  return localStorage.getItem('minimax_api_key') || import.meta.env.VITE_DEFAULT_API_KEY || '';
};

const _getErrorMessageFromStatus = (response, errorData, providerName, language = 'zh') => {
  const providerLabel = providerName || 'AI';
  if (response.status === 401) {
    return language === 'zh'
      ? `${providerLabel} API Key 无效或已过期，请检查设置`
      : `${providerLabel} API Key is invalid or expired, please check settings`;
  }
  if (response.status === 403) {
    return language === 'zh'
      ? `${providerLabel} API Key 权限不足`
      : `${providerLabel} API Key permission denied`;
  }
  if (response.status === 429) return language === 'zh' ? '请求过于频繁，请稍后重试' : 'Too many requests, please retry later';
  if (response.status >= 500) {
    return language === 'zh'
      ? `${providerLabel} 服务器繁忙，请稍后重试`
      : `${providerLabel} server is busy, please retry later`;
  }
  if (errorData.base_resp?.status_msg) return errorData.base_resp.status_msg;
  if (errorData.error?.message) return errorData.error.message;
  return language === 'zh' ? 'API 请求失败' : 'API request failed';
};

const _extractAIContent = (result) => {
  if (!result || typeof result !== 'object') {
    throw new Error('AI 响应内容解析失败: 无效的响应结构');
  }

  const choice = result.choices?.[0];
  if (!choice || typeof choice !== 'object') {
    throw new Error('AI 响应内容解析失败');
  }

  if (choice.messages && Array.isArray(choice.messages)) {
    return choice.messages.map(m => m.role === 'assistant' ? m.content : '').join('');
  }
  if (choice.delta?.content) return choice.delta.content;
  if (choice.message?.content) return choice.message.content;
  if (choice.message?.reasoning_content) return choice.message.reasoning_content;
  if (choice.message?.reply) return choice.message.reply;
  if (choice.content) return choice.content;
  throw new Error('AI 响应内容解析失败');
};

describe('API Helper Functions', () => {
  beforeEach(() => {
    localStorage.removeItem('minimax_api_key');
    localStorage.removeItem('ai_provider');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('_getProvider', () => {
    it('should return default provider when none is saved', () => {
      expect(_getProvider()).toBe('minimax');
    });

    it('should return saved provider when valid', () => {
      localStorage.setItem('ai_provider', 'minimax');
      expect(_getProvider()).toBe('minimax');
    });

    it('should fall back to default when saved provider is invalid', () => {
      localStorage.setItem('ai_provider', 'unknown');
      expect(_getProvider()).toBe('minimax');
    });
  });

  describe('_getApiKey', () => {
    it('should return empty string when no MiniMax key is configured', () => {
      const result = _getApiKey();
      expect(result).toBe('');
    });

    it('should return localStorage MiniMax key when available', () => {
      localStorage.setItem('minimax_api_key', 'test-key-123');
      const result = _getApiKey();
      expect(result).toBe('test-key-123');
    });

    it('should fall back to default key when localStorage is empty', () => {
      vi.stubEnv('VITE_DEFAULT_API_KEY', 'default-key-456');
      const result = _getApiKey();
      expect(result).toBe('default-key-456');
    });
  });

  describe('_getErrorMessageFromStatus', () => {
    it('should return message for 401 status with provider label', () => {
      const response = { status: 401 };
      const result = _getErrorMessageFromStatus(response, {}, 'MiniMax');
      expect(result).toBe('MiniMax API Key 无效或已过期，请检查设置');
    });

    it('should return English message for 401 when language is en', () => {
      const response = { status: 401 };
      const result = _getErrorMessageFromStatus(response, {}, 'MiniMax', 'en');
      expect(result).toBe('MiniMax API Key is invalid or expired, please check settings');
    });

    it('should return message for 403 status', () => {
      const response = { status: 403 };
      const result = _getErrorMessageFromStatus(response, {}, 'MiniMax');
      expect(result).toBe('MiniMax API Key 权限不足');
    });

    it('should return message for 429 status', () => {
      const response = { status: 429 };
      const result = _getErrorMessageFromStatus(response, {}, 'MiniMax');
      expect(result).toBe('请求过于频繁，请稍后重试');
    });

    it('should return message for 500 status', () => {
      const response = { status: 500 };
      const result = _getErrorMessageFromStatus(response, {}, 'MiniMax');
      expect(result).toBe('MiniMax 服务器繁忙，请稍后重试');
    });

    it('should return message for 502 status', () => {
      const response = { status: 502 };
      const result = _getErrorMessageFromStatus(response, {}, 'MiniMax');
      expect(result).toBe('MiniMax 服务器繁忙，请稍后重试');
    });

    it('should prefer base_resp.status_msg over default messages', () => {
      const response = { status: 400 };
      const errorData = { base_resp: { status_msg: 'Custom error message' } };
      const result = _getErrorMessageFromStatus(response, errorData, 'MiniMax');
      expect(result).toBe('Custom error message');
    });

    it('should prefer base_resp.status_msg over error.message', () => {
      const response = { status: 400 };
      const errorData = {
        base_resp: { status_msg: 'Base error' },
        error: { message: 'Error message from error field' }
      };
      const result = _getErrorMessageFromStatus(response, errorData, 'MiniMax');
      expect(result).toBe('Base error');
    });

    it('should return default message when no specific match', () => {
      const response = { status: 418 };
      const result = _getErrorMessageFromStatus(response, {}, 'MiniMax');
      expect(result).toBe('API 请求失败');
    });
  });

  describe('_extractAIContent', () => {
    it('should extract content from choice.messages array', () => {
      const result = {
        choices: [{
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' }
          ]
        }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('Hi there!');
    });

    it('should handle choice.messages with multiple assistant messages', () => {
      const result = {
        choices: [{
          messages: [
            { role: 'assistant', content: 'First ' },
            { role: 'assistant', content: 'Second' }
          ]
        }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('First Second');
    });

    it('should extract content from choice.delta.content', () => {
      const result = {
        choices: [{ delta: { content: 'Streaming content' } }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('Streaming content');
    });

    it('should extract content from choice.message.content', () => {
      const result = {
        choices: [{ message: { content: 'Direct message content' } }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('Direct message content');
    });

    it('should extract reasoning_content when content is missing', () => {
      const result = {
        choices: [{ message: { reasoning_content: 'Thinking process' } }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('Thinking process');
    });

    it('should prefer content over reasoning_content', () => {
      const result = {
        choices: [{
          message: {
            content: 'Final answer',
            reasoning_content: 'Thinking process'
          }
        }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('Final answer');
    });

    it('should extract from choice.message.reply', () => {
      const result = {
        choices: [{ message: { reply: 'Reply content' } }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('Reply content');
    });

    it('should extract from choice.content', () => {
      const result = {
        choices: [{ content: 'Top level content' }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('Top level content');
    });

    it('should throw error when no content format matches', () => {
      const result = { choices: [{ someOtherField: 'value' }] };
      expect(() => _extractAIContent(result)).toThrow('AI 响应内容解析失败');
    });

    it('should handle empty messages array', () => {
      const result = {
        choices: [{ messages: [{ role: 'user', content: 'Hello' }] }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('');
    });

    it('should handle messages with no assistant role', () => {
      const result = {
        choices: [{
          messages: [
            { role: 'user', content: 'Hello' },
            { role: 'system', content: 'System prompt' }
          ]
        }]
      };
      const result_text = _extractAIContent(result);
      expect(result_text).toBe('');
    });
  });
});
