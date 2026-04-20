// 本地数据加载服务 - 纯前端无需后端
import tarotData from '../../../resources/tarot-data.json';
import { spreads, getRecommendedPersona as getSpreadPersona } from '../data/spreads';
import { personas, getPersona } from '../data/personas';
import { AI_CONFIG } from '../constants';

// 辅助函数：获取 API Key
const _getApiKey = () => {
  const key = localStorage.getItem('minimax_api_key');
  return key || import.meta.env.VITE_DEFAULT_API_KEY;
};

// 辅助函数：从 HTTP 状态码获取错误消息
const _getErrorMessageFromStatus = (response, errorData) => {
  if (response.status === 401) return 'API Key 无效或已过期，请检查设置';
  if (response.status === 403) return 'API Key 权限不足';
  if (response.status === 429) return '请求过于频繁，请稍后重试';
  if (response.status >= 500) return 'MiniMax 服务器繁忙，请稍后重试';
  if (errorData.base_resp?.status_msg) return errorData.base_resp.status_msg;
  if (errorData.error?.message) return errorData.error.message;
  return 'API 请求失败';
};

// 辅助函数：从 AI 响应中提取内容
const _extractAIContent = (choice) => {
  if (choice.messages && Array.isArray(choice.messages)) {
    return choice.messages.map(m => m.role === 'assistant' ? m.content : '').join('');
  }
  if (choice.delta?.content) return choice.delta.content;
  if (choice.message?.content) return choice.message.content;
  throw new Error('AI 响应内容解析失败');
};

const api = {
  // 导出 personas 以保持向后兼容
  personas,

  // 导出 spreads 以保持向后兼容
  spreads,

  // 获取所有塔罗牌
  async getCards() {
    return tarotData.cards;
  },

  // 根据ID获取单张牌
  async getCard(id) {
    return tarotData.cards.find(card => card.id === id);
  },

  // 搜索塔罗牌
  async searchCards(params) {
    let cards = tarotData.cards;

    if (params.arcana) {
      cards = cards.filter(c => c.arcana === params.arcana);
    }

    if (params.suit) {
      cards = cards.filter(c => c.suit === params.suit);
    }

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      cards = cards.filter(c =>
        c.name.toLowerCase().includes(kw) ||
        c.nameEn.toLowerCase().includes(kw) ||
        (c.keywords && c.keywords.some(k => k.toLowerCase().includes(kw)))
      );
    }

    return cards;
  },

  // 占卜相关 - 本地模拟
  async createDivination(data) {
    // 模拟创建占卜记录
    return {
      id: Date.now(),
      ...data,
      createdAt: new Date().toISOString()
    };
  },

  async getDivination(_id) {
    return null;
  },

  // 运势相关 - 本地数据
  async getHoroscope(zodiac) {
    const horoscopes = this.getHoroscopesData();
    return horoscopes[zodiac] || null;
  },

  async getAllHoroscopes() {
    return this.getHoroscopesData();
  },

  getHoroscopesData() {
    return {
      aries: {
        name: '白羊座',
        overall: '今日运势整体不错，适合开展新项目。',
        love: '感情上可能会有意外惊喜。',
        career: '工作上表现突出，获得认可。',
        finance: '财务状况稳定，适合投资。'
      },
      taurus: {
        name: '金牛座',
        overall: '今日运势平稳，适合稳扎稳打。',
        love: '感情关系需要更多沟通。',
        career: '在工作方面需要更多耐心。',
        finance: '财务状况良好，注意节约。'
      },
      gemini: {
        name: '双子座',
        overall: '今日思维活跃，适合创意工作。',
        love: '爱情运势上升，单身者有机会。',
        career: '沟通能力得到发挥。',
        finance: '财务收支平衡。'
      },
      cancer: {
        name: '巨蟹座',
        overall: '今日情绪稳定，家庭运不错。',
        love: '与家人相处融洽。',
        career: '适合处理家务事。',
        finance: '财务状况稳定。'
      },
      leo: {
        name: '狮子座',
        overall: '今日自信满满，魅力四射。',
        love: '感情生活丰富多彩。',
        career: '领导能力得到展现。',
        finance: '财务状况不错。'
      },
      virgo: {
        name: '处女座',
        overall: '今日适合处理细节问题。',
        love: '感情上需要更加细心。',
        career: '工作效率高，获得好评。',
        finance: '财务状况良好。'
      },
      libra: {
        name: '天秤座',
        overall: '今日人际关系和谐。',
        love: '感情关系需要平衡。',
        career: '协作能力得到发挥。',
        finance: '财务状况稳定。'
      },
      scorpio: {
        name: '天蝎座',
        overall: '今日洞察力敏锐。',
        love: '感情上可能会有突破。',
        career: '适合深入研究问题。',
        finance: '财务状况不错。'
      },
      sagittarius: {
        name: '射手座',
        overall: '今日适合冒险和探索。',
        love: '单身者有机会遇到心仪的人。',
        career: '适合出差或旅行。',
        finance: '财务状况起伏。'
      },
      capricorn: {
        name: '摩羯座',
        overall: '今日事业心强。',
        love: '感情上比较务实。',
        career: '工作进展顺利。',
        finance: '财务状况稳定。'
      },
      aquarius: {
        name: '水瓶座',
        overall: '今日创意十足。',
        love: '感情上需要更多自由。',
        career: '适合创新项目。',
        finance: '财务状况良好。'
      },
      pisces: {
        name: '双鱼座',
        overall: '今日直觉敏锐。',
        love: '感情生活温馨。',
        career: '艺术创造力旺盛。',
        finance: '财务状况需要关注。'
      }
    };
  },

  // 认证相关 - 简化版本
  async sendCode(_phone) {
    return { success: true };
  },

  async verifyCode(_phone, _code) {
    return { success: true, token: 'demo-token' };
  },

  async getMe() {
    return null;
  },

  // 订单相关 - 简化版本
  async createOrder(data) {
    return { id: Date.now(), ...data };
  },

  async getOrders() {
    return [];
  },

  // AI 解读相关
  async getAIInterpretation(data) {
    // 错误场景1: API Key 未配置
    const apiKey = _getApiKey();
    if (!apiKey) {
      throw new Error('请先在设置中配置 MiniMax API Key');
    }

    // 错误场景2: API Key 格式无效
    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('eyJ')) {
      console.error('[AI解读] 无效的 API Key 格式:', apiKey.substring(0, 10) + '...');
      throw new Error('API Key 格式无效，请检查设置');
    }

    const requestBody = {
      model: AI_CONFIG.MODEL,
      messages: this.buildTarotMessages(data),
      stream: false,
      temperature: AI_CONFIG.TEMPERATURE,
      top_p: AI_CONFIG.TOP_P,
      max_completion_tokens: AI_CONFIG.MAX_COMPLETION_TOKENS
    };

    console.log('[AI解读] 发送请求:', {
      url: AI_CONFIG.API_URL,
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      cardsCount: data.drawnCards.length
    });

    let response;
    try {
      response = await fetch(AI_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
    } catch (networkError) {
      // 错误场景3: 网络连接失败
      console.error('[AI解读] 网络错误:', networkError);
      throw new Error('网络连接失败，请检查网络后重试');
    }

    // 错误场景4: HTTP 状态码错误
    if (!response.ok) {
      let errorMsg = 'API 请求失败';
      try {
        const errorData = await response.json();
        console.error('[AI解读] API 错误响应:', errorData);
        errorMsg = _getErrorMessageFromStatus(response, errorData);
      } catch {
        // 忽略解析错误
      }
      throw new Error(errorMsg);
    }

    // 错误场景5: 响应格式解析失败
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('[AI解读] 解析响应 JSON 失败:', parseError);
      throw new Error('服务器响应格式错误，请稍后重试');
    }

    console.log('[AI解读] 响应结构:', Object.keys(result));

    // 错误场景6: 响应中缺少必要字段
    if (!result.choices || !Array.isArray(result.choices) || result.choices.length === 0) {
      console.error('[AI解读] 无效的响应结构:', result);
      throw new Error('AI 响应格式错误，请稍后重试');
    }

    const choice = result.choices[0];
    if (!choice.finish_reason && !choice.messages) {
      console.error('[AI解读] 无效的 choice 结构:', choice);
      throw new Error('AI 响应格式错误，请稍后重试');
    }

    // 提取 AI 回复内容
    let aiContent;
    try {
      aiContent = _extractAIContent(choice);
    } catch (err) {
      console.error('[AI解读] 无法提取内容:', choice);
      throw err;
    }

    if (!aiContent || aiContent.trim() === '') {
      console.warn('[AI解读] AI 返回空内容');
      throw new Error('AI 暂时无法提供解读，请稍后重试');
    }

    console.log('[AI解读] 成功获取回复, 长度:', aiContent.length);
    return aiContent.trim();
  },

  // 获取推荐角色
  getRecommendedPersona(spreadId, question) {
    const personaId = getSpreadPersona(spreadId, question);
    return getPersona(personaId);
  },

  buildTarotMessages(data) {
    const { question, selectedSpread } = data;

    // 获取合适的角色
    const persona = this.getRecommendedPersona(selectedSpread?.id, question);
    const systemPrompt = persona.description;

    const userContent = this.buildTarotPrompt(data);

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];
  },

  buildTarotPrompt(data) {
    const { question, selectedSpread, drawnCards } = data;
    let prompt = `牌阵类型：${selectedSpread.name}\n`;
    prompt += `用户问题：${question || '无特定问题，希望了解整体运势'}\n\n`;
    prompt += `抽到的牌：\n`;

    drawnCards.forEach((card, idx) => {
      const positionName = selectedSpread.positions?.[idx]?.name || `位置 ${idx + 1}`;
      prompt += `${idx + 1}. ${positionName} - ${card.name} (${card.isReversed ? '逆位' : '正位'})\n`;
      prompt += `   牌义：${card.isReversed ? card.reversedDescription : card.description}\n`;
      prompt += `   关键词：${card.keywords?.join(', ') || '无'}\n\n`;
    });

    prompt += `请解读这些牌与用户问题的关系，提供深入的分析和指导建议。请用中文回答，以 Markdown 格式输出即可。`;
    return prompt;
  },

  // AI 星座运势分析
  async getAIHoroscope(zodiacId, zodiacName, date = null) {
    const apiKey = _getApiKey();
    if (!apiKey) {
      throw new Error('请先在设置中配置 MiniMax API Key');
    }

    // 使用传入的日期或当前日期
    const currentDate = date || {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate()
    };

    const systemPrompt = `你是一位专业的星座运势分析师，专门为用户提供详细的每日/每周运势分析。你需要根据星座的特性和当前星象位置，给出准确、富有洞察力的运势预测。请用中文回答，以 Markdown 格式输出。`;

    const userContent = `请分析 ${zodiacName} 于 ${currentDate.year}年${currentDate.month}月${currentDate.day}日 的综合运势，包括但不限于：
1. 整体运势走向
2. 爱情运势
3. 事业运势
4. 财运
5. 幸运数字、颜色、方向等小贴士

请用专业但亲切的语气给出分析。`;

    const requestBody = {
      model: AI_CONFIG.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      stream: false,
      temperature: AI_CONFIG.TEMPERATURE,
      top_p: AI_CONFIG.TOP_P,
      max_completion_tokens: AI_CONFIG.MAX_COMPLETION_TOKENS
    };

    let response;
    try {
      response = await fetch(AI_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
    } catch {
      throw new Error('网络连接失败，请检查网络后重试');
    }

    if (!response.ok) {
      let errorMsg = 'API 请求失败';
      try {
        const errorData = await response.json();
        errorMsg = _getErrorMessageFromStatus(response, errorData);
      } catch {
        // ignore parse error
      }
      throw new Error(errorMsg);
    }

    const result = await response.json();

    if (!result.choices || !Array.isArray(result.choices) || result.choices.length === 0) {
      throw new Error('AI 响应格式错误，请稍后重试');
    }

    const choice = result.choices[0];
    let aiContent;
    try {
      aiContent = _extractAIContent(choice);
    } catch {
      throw new Error('AI 暂时无法提供解读，请稍后重试');
    }

    if (!aiContent || aiContent.trim() === '') {
      throw new Error('AI 暂时无法提供解读，请稍后重试');
    }

    return aiContent.trim();
  }
};

export default api;
