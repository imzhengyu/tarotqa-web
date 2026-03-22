// 本地数据加载服务 - 纯前端无需后端
import tarotData from '../../../resources/tarot-data.json';
import { spreads, getRecommendedPersona as getSpreadPersona } from '../data/spreads';
import { personas, getPersona } from '../data/personas';

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
    // 优先使用用户配置的 API Key，其次使用默认 Key
    let apiKey = localStorage.getItem('minimax_api_key');
    if (!apiKey) {
      apiKey = import.meta.env.VITE_DEFAULT_API_KEY;
    }

    // 错误场景1: API Key 未配置
    if (!apiKey) {
      throw new Error('请先在设置中配置 MiniMax API Key');
    }

    // 错误场景2: API Key 格式无效
    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('eyJ')) {
      console.error('[AI解读] 无效的 API Key 格式:', apiKey.substring(0, 10) + '...');
      throw new Error('API Key 格式无效，请检查设置');
    }

    const requestBody = {
      model: 'MiniMax-M2.7',
      messages: this.buildTarotMessages(data),
      stream: false,  // 使用非流式响应便于处理
      temperature: 1,
      top_p: 0.95,
      max_completion_tokens: 2048
    };

    console.log('[AI解读] 发送请求:', {
      url: 'https://api.minimaxi.com/v1/text/chatcompletion_v2',
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      cardsCount: data.drawnCards.length
    });

    let response;
    try {
      response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
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

        // 解析常见错误
        if (response.status === 401) {
          errorMsg = 'API Key 无效或已过期，请检查设置';
        } else if (response.status === 403) {
          errorMsg = 'API Key 权限不足';
        } else if (response.status === 429) {
          errorMsg = '请求过于频繁，请稍后重试';
        } else if (response.status >= 500) {
          errorMsg = 'MiniMax 服务器繁忙，请稍后重试';
        } else if (errorData.base_resp?.status_msg) {
          errorMsg = errorData.base_resp.status_msg;
        } else if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        }
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
    if (choice.messages && Array.isArray(choice.messages)) {
      // MiniMax 格式: messages 数组
      aiContent = choice.messages.map(m => m.role === 'assistant' ? m.content : '').join('');
    } else if (choice.delta && choice.delta.content) {
      // 流式格式的单个 delta
      aiContent = choice.delta.content;
    } else if (choice.message && choice.message.content) {
      // 标准格式
      aiContent = choice.message.content;
    } else {
      console.error('[AI解读] 无法提取内容:', choice);
      throw new Error('AI 响应内容解析失败');
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
  }
};

export default api;
