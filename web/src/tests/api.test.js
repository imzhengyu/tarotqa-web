import { describe, it, expect, beforeEach } from 'vitest';
import api from '../services/api';

// Mock tarot data
const mockCards = [
  {
    id: 'fool',
    name: '愚者',
    nameEn: 'The Fool',
    arcana: 'major',
    suit: null,
    description: '新的开始、天真、自由',
    reversedDescription: '鲁莽、冒险、轻率',
    keywords: ['冒险', '开始', '自由', '天真', '旅行']
  },
  {
    id: 'magician',
    name: '魔术师',
    nameEn: 'The Magician',
    arcana: 'major',
    suit: null,
    description: '创造力、意志力、技能',
    reversedDescription: '欺骗、操控、缺乏技巧',
    keywords: ['创造', '意志', '技能', '沟通', '智慧']
  }
];

describe('API Service', () => {
  beforeEach(() => {
    localStorage.removeItem('minimax_api_key');
  });

  describe('getCards', () => {
    it('应该返回塔罗牌列表', async () => {
      const cards = await api.getCards();
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('每张牌应该包含必要的字段', async () => {
      const cards = await api.getCards();
      const firstCard = cards[0];
      expect(firstCard).toHaveProperty('id');
      expect(firstCard).toHaveProperty('name');
      expect(firstCard).toHaveProperty('nameEn');
      expect(firstCard).toHaveProperty('arcana');
    });
  });

  describe('getCard', () => {
    it('应该根据 ID 返回单张牌', async () => {
      const card = await api.getCard(0);
      expect(card).toBeDefined();
      expect(card.id).toBe(0);
      expect(card.name).toBe('愚者');
    });

    it('应该返回不存在的牌的 undefined', async () => {
      const card = await api.getCard(9999);
      expect(card).toBeUndefined();
    });
  });

  describe('searchCards', () => {
    it('应该返回所有牌当没有筛选条件时', async () => {
      const cards = await api.searchCards({});
      expect(Array.isArray(cards)).toBe(true);
    });

    it('应该根据 arcana 筛选牌', async () => {
      const cards = await api.searchCards({ arcana: 'major' });
      expect(Array.isArray(cards)).toBe(true);
      cards.forEach(card => {
        expect(card.arcana).toBe('major');
      });
    });

    it('应该根据 suit 筛选牌', async () => {
      const cards = await api.searchCards({ suit: 'wands' });
      expect(Array.isArray(cards)).toBe(true);
      cards.forEach(card => {
        expect(card.suit).toBe('wands');
      });
    });

    it('应该根据关键词搜索牌', async () => {
      const cards = await api.searchCards({ keyword: '愚者' });
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0].name).toBe('愚者');
    });

    it('应该支持英文名称搜索', async () => {
      const cards = await api.searchCards({ keyword: 'fool' });
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('搜索应该不区分大小写', async () => {
      const cards1 = await api.searchCards({ keyword: 'FOOL' });
      const cards2 = await api.searchCards({ keyword: 'fool' });
      expect(cards1.length).toBe(cards2.length);
    });

    it('应该组合多个筛选条件', async () => {
      const cards = await api.searchCards({ arcana: 'major', keyword: 'magic' });
      expect(Array.isArray(cards)).toBe(true);
      cards.forEach(card => {
        expect(card.arcana).toBe('major');
      });
    });
  });

  describe('createDivination', () => {
    it('应该创建占卜记录', async () => {
      const data = {
        question: '测试问题',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: [mockCards[0], mockCards[1]]
      };

      const result = await api.createDivination(data);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('createdAt');
      expect(result.question).toBe('测试问题');
    });
  });

  describe('getDivination', () => {
    it('应该返回 null（未实现）', async () => {
      const result = await api.getDivination(1);
      expect(result).toBeNull();
    });
  });

  describe('getHoroscope', () => {
    it('应该返回指定星座的运势', async () => {
      const horoscope = await api.getHoroscope('aries');
      expect(horoscope).toBeDefined();
      expect(horoscope).toHaveProperty('name');
      expect(horoscope.name).toBe('白羊座');
      expect(horoscope).toHaveProperty('overall');
      expect(horoscope).toHaveProperty('love');
      expect(horoscope).toHaveProperty('career');
      expect(horoscope).toHaveProperty('finance');
    });

    it('应该返回不存在的星座的 null', async () => {
      const horoscope = await api.getHoroscope('unknown');
      expect(horoscope).toBeNull();
    });
  });

  describe('getAllHoroscopes', () => {
    it('应该返回所有星座运势', async () => {
      const horoscopes = await api.getAllHoroscopes();
      expect(Object.keys(horoscopes).length).toBe(12);
    });

    it('应该包含所有12个星座', async () => {
      const horoscopes = await api.getAllHoroscopes();
      const zodiacs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
      zodiacs.forEach(zodiac => {
        expect(horoscopes).toHaveProperty(zodiac);
      });
    });
  });

  describe('getHoroscopesData', () => {
    it('应该返回运势数据对象', () => {
      const data = api.getHoroscopesData();
      expect(typeof data).toBe('object');
      expect(Object.keys(data).length).toBe(12);
    });

    it('每个星座应该包含正确的字段', () => {
      const data = api.getHoroscopesData();
      const aries = data.aries;
      expect(aries).toHaveProperty('name');
      expect(aries).toHaveProperty('overall');
      expect(aries).toHaveProperty('love');
      expect(aries).toHaveProperty('career');
      expect(aries).toHaveProperty('finance');
    });
  });

  describe('sendCode', () => {
    it('应该返回成功结果', async () => {
      const result = await api.sendCode('13800138000');
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });
  });

  describe('verifyCode', () => {
    it('应该返回成功结果和 token', async () => {
      const result = await api.verifyCode('13800138000', '123456');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('token');
      expect(result.success).toBe(true);
      expect(result.token).toBe('demo-token');
    });
  });

  describe('getMe', () => {
    it('应该返回 null', async () => {
      const result = await api.getMe();
      expect(result).toBeNull();
    });
  });

  describe('createOrder', () => {
    it('应该创建订单并返回订单 ID', async () => {
      const result = await api.createOrder({ type: 'test' });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
    });
  });

  describe('getOrders', () => {
    it('应该返回空数组', async () => {
      const result = await api.getOrders();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('personas', () => {
    it('应该包含所有必需的角色', () => {
      expect(api.personas).toHaveProperty('general');
      expect(api.personas).toHaveProperty('career');
      expect(api.personas).toHaveProperty('love');
      expect(api.personas).toHaveProperty('finance');
      expect(api.personas).toHaveProperty('decision');
      expect(api.personas).toHaveProperty('fortune');
    });

    it('每个角色应该有 id、name 和 description', () => {
      Object.values(api.personas).forEach(persona => {
        expect(persona).toHaveProperty('id');
        expect(persona).toHaveProperty('name');
        expect(persona).toHaveProperty('description');
        expect(typeof persona.description).toBe('string');
        expect(persona.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getRecommendedPersona', () => {
    it('应该根据问题关键词返回 career', () => {
      const result = api.getRecommendedPersona('three-cards', '关于工作的问题');
      expect(result.id).toBe('career');
    });

    it('应该根据问题关键词返回 love', () => {
      const result = api.getRecommendedPersona('three-cards', '关于爱情的问题');
      expect(result.id).toBe('love');
    });

    it('应该根据问题关键词返回 finance', () => {
      const result = api.getRecommendedPersona('three-cards', '关于金钱投资的问题');
      expect(result.id).toBe('finance');
    });

    it('应该根据问题关键词返回 decision', () => {
      const result = api.getRecommendedPersona('three-cards', '需要做选择的问题');
      expect(result.id).toBe('decision');
    });

    it('应该根据问题关键词返回 fortune', () => {
      const result = api.getRecommendedPersona('three-cards', '想知道未来运势');
      expect(result.id).toBe('fortune');
    });

    it('应该根据牌阵类型返回 celtic_cross -> decision', () => {
      const result = api.getRecommendedPersona('celtic_cross', '');
      expect(result.id).toBe('decision');
    });

    it('应该根据牌阵类型返回 love-pyramid -> love', () => {
      const result = api.getRecommendedPersona('love-pyramid', '');
      expect(result.id).toBe('love');
    });

    it('应该根据牌阵类型返回 horseshoe -> fortune', () => {
      const result = api.getRecommendedPersona('horseshoe', '');
      expect(result.id).toBe('fortune');
    });

    it('应该根据牌阵类型返回 single -> general', () => {
      const result = api.getRecommendedPersona('single', '');
      expect(result.id).toBe('general');
    });

    it('应该根据牌阵类型返回 three-cards -> general', () => {
      const result = api.getRecommendedPersona('three-cards', '');
      expect(result.id).toBe('general');
    });

    it('应该优先使用问题关键词而不是牌阵类型', () => {
      const result = api.getRecommendedPersona('celtic_cross', '关于爱情的问题');
      expect(result.id).toBe('love');
    });

    it('应该返回默认的 general 当没有任何匹配时', () => {
      const result = api.getRecommendedPersona('unknown-spread', '无关问题');
      expect(result.id).toBe('general');
    });

    it('应该处理空问题字符串', () => {
      const result = api.getRecommendedPersona('three-cards', '');
      expect(result.id).toBe('general');
    });

    it('关键词匹配应该不区分大小写', () => {
      // 中文关键词本身没有大小写之分，所以直接匹配
      const result1 = api.getRecommendedPersona('three-cards', '关于工作的问题');
      expect(result1.id).toBe('career');

      // 验证 toLowerCase() 不会影响中文匹配
      const result2 = api.getRecommendedPersona('three-cards', '关于工作的WEEK');
      expect(result2.id).toBe('career');
    });

    it('应该支持多个关键词匹配', () => {
      const result1 = api.getRecommendedPersona('three-cards', '跳槽');
      const result2 = api.getRecommendedPersona('three-cards', '晋升');
      const result3 = api.getRecommendedPersona('three-cards', '加薪');
      expect(result1.id).toBe('career');
      expect(result2.id).toBe('career');
      expect(result3.id).toBe('career');
    });
  });

  describe('buildTarotMessages', () => {
    it('应该返回包含 system 和 user 消息的数组', () => {
      const data = {
        question: '测试问题',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: [mockCards[0], mockCards[1]]
      };

      const messages = api.buildTarotMessages(data);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
    });

    it('system 消息应该包含角色描述', () => {
      const data = {
        question: '测试问题',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: [mockCards[0], mockCards[1]]
      };

      const messages = api.buildTarotMessages(data);
      expect(typeof messages[0].content).toBe('string');
      expect(messages[0].content.length).toBeGreaterThan(0);
    });

    it('user 消息应该包含抽牌信息', () => {
      const data = {
        question: '我的未来如何？',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: [mockCards[0], mockCards[1]]
      };

      const messages = api.buildTarotMessages(data);
      expect(messages[1].content).toContain('三张牌阵');
      expect(messages[1].content).toContain('我的未来如何？');
      expect(messages[1].content).toContain('愚者');
      expect(messages[1].content).toContain('魔术师');
    });

    it('应该处理空问题', () => {
      const data = {
        question: '',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: [mockCards[0]]
      };

      const messages = api.buildTarotMessages(data);
      expect(messages[1].content).toContain('无特定问题');
    });
  });

  describe('buildTarotPrompt', () => {
    it('应该包含牌阵类型', () => {
      const data = {
        question: '测试',
        selectedSpread: { id: 'celtic_cross', name: '凯尔特十字' },
        drawnCards: []
      };

      const prompt = api.buildTarotPrompt(data);
      expect(prompt).toContain('凯尔特十字');
    });

    it('应该包含用户问题', () => {
      const data = {
        question: '我的工作会顺利吗？',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: []
      };

      const prompt = api.buildTarotPrompt(data);
      expect(prompt).toContain('我的工作会顺利吗？');
    });

    it('应该包含抽到的牌信息', () => {
      const data = {
        question: '测试',
        selectedSpread: {
          id: 'three-cards',
          name: '三张牌阵',
          positions: [
            { name: '过去' },
            { name: '现在' },
            { name: '未来' }
          ]
        },
        drawnCards: [
          { ...mockCards[0], isReversed: false },
          { ...mockCards[1], isReversed: true }
        ]
      };

      const prompt = api.buildTarotPrompt(data);
      expect(prompt).toContain('1. 过去 - 愚者 (正位)');
      expect(prompt).toContain('2. 现在 - 魔术师 (逆位)');
    });

    it('应该包含牌的描述和关键词', () => {
      const data = {
        question: '测试',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: [{ ...mockCards[0], isReversed: false }]
      };

      const prompt = api.buildTarotPrompt(data);
      expect(prompt).toContain('牌义');
      expect(prompt).toContain('关键词');
      expect(prompt).toContain('冒险');
    });

    it('应该正确处理逆位牌', () => {
      const data = {
        question: '测试',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: [{ ...mockCards[0], isReversed: true }]
      };

      const prompt = api.buildTarotPrompt(data);
      expect(prompt).toContain('逆位');
      expect(prompt).toContain('鲁莽、冒险、轻率');
    });

    it('应该处理缺少位置的牌', () => {
      const data = {
        question: '测试',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: [mockCards[0]]
      };

      const prompt = api.buildTarotPrompt(data);
      expect(prompt).toContain('位置 1');
    });

    it('应该包含结束语', () => {
      const data = {
        question: '测试',
        selectedSpread: { id: 'three-cards', name: '三张牌阵' },
        drawnCards: []
      };

      const prompt = api.buildTarotPrompt(data);
      expect(prompt).toContain('请解读这些牌与用户问题的关系');
      expect(prompt).toContain('Markdown 格式输出');
    });
  });

  describe('getAIInterpretation', () => {
    it('应该抛出错误当没有配置 API Key 且无默认 Key', async () => {
      localStorage.removeItem('minimax_api_key');

      try {
        await api.getAIInterpretation({
          question: '测试',
          selectedSpread: { id: 'three-cards', name: '三张牌阵' },
          drawnCards: [mockCards[0]]
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('请先在设置中配置 MiniMax API Key');
      }
    });

    it('应该抛出错误当 API Key 格式无效', async () => {
      localStorage.setItem('minimax_api_key', 'invalid-key-format');

      try {
        await api.getAIInterpretation({
          question: '测试',
          selectedSpread: { id: 'three-cards', name: '三张牌阵' },
          drawnCards: [mockCards[0]]
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('API Key 格式无效，请检查设置');
      }
    });

    it('应该接受有效的 Bearer token 格式', async () => {
      localStorage.setItem('minimax_api_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');

      try {
        await api.getAIInterpretation({
          question: '测试',
          selectedSpread: { id: 'three-cards', name: '三张牌阵' },
          drawnCards: [mockCards[0]]
        });
      } catch (error) {
        expect(error.message).not.toBe('API Key 格式无效，请检查设置');
      }
    });

    it('应该接受 sk- 前缀的 API Key', async () => {
      localStorage.setItem('minimax_api_key', 'sk-abcdef123456');

      try {
        await api.getAIInterpretation({
          question: '测试',
          selectedSpread: { id: 'three-cards', name: '三张牌阵' },
          drawnCards: [mockCards[0]]
        });
      } catch (error) {
        expect(error.message).not.toBe('API Key 格式无效，请检查设置');
      }
    });
  });

  describe('API Key Priority', () => {
    it('应该处理 localStorage 中 API Key 为空字符串', async () => {
      localStorage.setItem('minimax_api_key', '');

      try {
        await api.getAIInterpretation({
          question: '测试',
          selectedSpread: { id: 'three-cards', name: '三张牌阵' },
          drawnCards: [mockCards[0]]
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('请先在设置中配置 MiniMax API Key');
      }
    });
  });

  describe('getAIInterpretation with Mocked Fetch', () => {
    const originalFetch = global.fetch;
    const mockData = {
      question: '测试',
      selectedSpread: { id: 'three-cards', name: '三张牌阵' },
      drawnCards: [mockCards[0]]
    };

    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('应该处理网络错误', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('网络连接失败，请检查网络后重试');
      }
    });

    it('应该处理 HTTP 401 错误', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ base_resp: { status_msg: 'Unauthorized' } })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('API Key 无效或已过期，请检查设置');
      }
    });

    it('应该处理 HTTP 403 错误', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ base_resp: { status_msg: 'Forbidden' } })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('API Key 权限不足');
      }
    });

    it('应该处理 HTTP 429 错误', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: vi.fn().mockResolvedValue({ base_resp: { status_msg: 'Rate limit' } })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('请求过于频繁，请稍后重试');
      }
    });

    it('应该处理 HTTP 500 错误', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ base_resp: { status_msg: 'Server error' } })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('MiniMax 服务器繁忙，请稍后重试');
      }
    });

    it('应该处理无效的 JSON 响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('服务器响应格式错误，请稍后重试');
      }
    });

    it('应该处理缺少 choices 的响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('AI 响应格式错误，请稍后重试');
      }
    });

    it('应该处理空 choices 数组的响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ choices: [] })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('AI 响应格式错误，请稍后重试');
      }
    });

    it('应该处理缺少 finish_reason 和 messages 的 choice', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ someField: 'value' }]
        })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('AI 响应格式错误，请稍后重试');
      }
    });

    it('应该处理 AI 返回空内容', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            finish_reason: 'stop',
            message: { content: '   ' }
          }]
        })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('AI 暂时无法提供解读，请稍后重试');
      }
    });

    it('应该成功解析 MiniMax 格式的响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            finish_reason: 'stop',
            messages: [
              { role: 'assistant', content: '这是一个塔罗牌解读。' }
            ]
          }]
        })
      });

      const result = await api.getAIInterpretation(mockData);
      expect(result).toBe('这是一个塔罗牌解读。');
    });

    it('应该成功解析标准格式的响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            finish_reason: 'stop',
            message: { content: '塔罗牌解读内容。' }
          }]
        })
      });

      const result = await api.getAIInterpretation(mockData);
      expect(result).toBe('塔罗牌解读内容。');
    });

    it('应该成功解析 delta 格式的响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            finish_reason: 'stop',
            delta: { content: 'Delta 格式内容。' }
          }]
        })
      });

      const result = await api.getAIInterpretation(mockData);
      expect(result).toBe('Delta 格式内容。');
    });

    it('应该处理带有 error.message 的错误响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({
          error: { message: 'Invalid request parameters' }
        })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('Invalid request parameters');
      }
    });

    it('应该处理无法解析的 HTTP 错误响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue(null),
        text: vi.fn().mockResolvedValue('Internal Server Error')
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('MiniMax 服务器繁忙，请稍后重试');
      }
    });

    it('应该处理 choices 为 null 的响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ choices: null })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('AI 响应格式错误，请稍后重试');
      }
    });

    it('应该处理 choices 为 undefined 的响应', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('AI 响应格式错误，请稍后重试');
      }
    });

    it('应该处理 choice 对象所有必需字段都缺失的情况', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ notAFinishReason: 'test', notMessages: [] }]
        })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('AI 响应格式错误，请稍后重试');
      }
    });

    it('应该处理 choice 中 delta 和 message 都不存在的情况', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ finish_reason: 'stop' }]
        })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('AI 响应内容解析失败');
      }
    });

    it('应该处理 message.content 为空字符串的情况', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            finish_reason: 'stop',
            message: { content: '' }
          }]
        })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        // 空字符串 content 会因为无法提取内容而抛出此错误
        expect(error.message).toBe('AI 响应内容解析失败');
      }
    });

    it('应该处理 delta.content 为空字符串的情况', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            finish_reason: 'stop',
            delta: { content: '' }
          }]
        })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        // 空字符串 content 会因为无法提取内容而抛出此错误
        expect(error.message).toBe('AI 响应内容解析失败');
      }
    });

    it('应该处理 messages 数组全为空内容的情况', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            finish_reason: 'stop',
            messages: [
              { role: 'user', content: '问题' },
              { role: 'assistant', content: '' },
              { role: 'system', content: '' }
            ]
          }]
        })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('AI 暂时无法提供解读，请稍后重试');
      }
    });

    it('应该正确拼接多个 assistant 消息的内容', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            finish_reason: 'stop',
            messages: [
              { role: 'assistant', content: '第一部分' },
              { role: 'assistant', content: '第二部分' },
              { role: 'assistant', content: '第三部分' }
            ]
          }]
        })
      });

      const result = await api.getAIInterpretation(mockData);
      expect(result).toBe('第一部分第二部分第三部分');
    });

    it('应该忽略非 assistant 角色的消息', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            finish_reason: 'stop',
            messages: [
              { role: 'user', content: '用户内容' },
              { role: 'system', content: '系统内容' },
              { role: 'assistant', content: '助手内容' }
            ]
          }]
        })
      });

      const result = await api.getAIInterpretation(mockData);
      expect(result).toBe('助手内容');
    });

    it('应该处理 HTTP 400 错误', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ base_resp: { status_msg: 'Bad Request' } })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('Bad Request');
      }
    });

    it('应该处理 HTTP 502 错误', async () => {
      localStorage.setItem('minimax_api_key', 'sk-valid-key');
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: vi.fn().mockResolvedValue({ base_resp: { status_msg: 'Bad Gateway' } })
      });

      try {
        await api.getAIInterpretation(mockData);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).toBe('MiniMax 服务器繁忙，请稍后重试');
      }
    });
  });
});