// 本地数据加载服务 - 纯前端无需后端
import tarotData from '../../../resources/tarot-data.json';

const api = {
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

  async getDivination(id) {
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
  async sendCode(phone) {
    console.log('短信验证码功能已简化');
    return { success: true };
  },

  async verifyCode(phone, code) {
    console.log('登录功能已简化');
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
      let errorDetail = null;

      try {
        const errorData = await response.json();
        errorDetail = errorData;
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
      } catch (parseError) {
        console.error('[AI解读] 解析错误响应失败:', parseError);
        errorDetail = await response.text().catch(() => '无法读取响应');
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

  // 塔罗角色设定
  personas: {
    general: {
      id: 'general',
      name: '综合顾问',
      description: '你是一位资深的塔罗牌解读师，拥有多年的占卜经验。你的解读风格：深入浅出，既专业又易懂；善于结合牌面正逆位解读其象征意义；关注牌与牌之间的关联性；提供积极正面的引导建议；回答使用中文。'
    },
    career: {
      id: 'career',
      name: '职涯发展顾问',
      description: `你是一位专业的事业发展塔罗顾问。

请按照以下步骤进行解读：

1. 深入了解我的职业背景、目前状况和具体困扰
2. 从以下维度解读牌面：
   - 目前的职业状态和优势
   - 面临的挑战和机会
   - 适合的发展方向和策略
   - 需要提升的能力或注意的事项
   - 时机把握和行动建议
3. 提供实用的职涯发展建议和具体行动计划

请保持专业和务实的态度，重点关注可行性和实际操作建议。`
    },
    love: {
      id: 'love',
      name: '爱情情感顾问',
      description: `你是一位专业的情感关系塔罗顾问，专注于爱情和感情问题的解读。

解读维度：
- 目前的感情状态和关系质量
- 双方的优势和潜在矛盾
- 影响感情发展的外部因素
- 适合的关系模式和改进建议
- 未来发展趋势和时机

请以温暖、理解的态度提供建议，同时保持客观和真实。`
    },
    finance: {
      id: 'finance',
      name: '财富财务顾问',
      description: `你是一位专业的财富运势塔罗顾问，专注于财务和财运方面的解读。

解读维度：
- 目前的财务状况和收支平衡
- 理财优势和潜在风险
- 适合的投资方向和策略
- 财务决策的时机建议
- 财富积累的长期规划

请提供务实、可操作的财富管理建议。`
    },
    decision: {
      id: 'decision',
      name: '决策指引顾问',
      description: `你是一位专业的决策指引塔罗顾问，擅长帮助用户理清复杂局面下的选择。

解读维度：
- 核心问题的本质分析
- 各选项的利弊对比
- 内心的真实诉求和恐惧
- 隐藏的机遇和风险
- 最佳决策时机和行动方案

请帮助用户全面分析局势，做出明智选择。`
    },
    fortune: {
      id: 'fortune',
      name: '综合运势顾问',
      description: `你是一位经验丰富的综合运势塔罗顾问，提供全方位的运势解读。

解读维度：
- 整体运势走向
- 各领域发展（事业、感情、健康、财运）
- 年度/月度重要时间节点
- 需要特别注意的时期
- 趋吉避凶的建议

请提供全面而平衡的运势分析。`
    }
  },

  // 根据牌阵ID获取推荐角色
  getRecommendedPersona(spreadId, question) {
    const keywordMap = {
      career: ['工作', '事业', '跳槽', '面试', '职场', '职业', '创业', '辞职', '加薪', '晋升'],
      love: ['爱情', '感情', '恋人', '复合', '桃花', '婚姻', '约会', '暗恋', '表白', '分手'],
      finance: ['金钱', '财富', '投资', '理财', '财运', '财务', '收入', '债务', '债务', '赚钱'],
      decision: ['选择', '决定', '纠结', '两难', '犹豫', '决策'],
      fortune: ['运势', '运气', '未来', '趋势', '年度', '月份']
    };

    const spreadPersonaMap = {
      'single': 'general',
      'three-cards': 'general',
      'celtic_cross': 'decision',
      'love-pyramid': 'love',
      'horseshoe': 'fortune'
    };

    // 如果有问题，先检查关键词
    if (question) {
      const q = question.toLowerCase();
      for (const [personaId, keywords] of Object.entries(keywordMap)) {
        if (keywords.some(kw => q.includes(kw))) {
          return this.personas[personaId];
        }
      }
    }

    // 其次按牌阵类型选择
    if (spreadId && spreadPersonaMap[spreadId]) {
      return this.personas[spreadPersonaMap[spreadId]];
    }

    // 默认使用综合顾问
    return this.personas.general;
  },

  buildTarotMessages(data) {
    const { question, selectedSpread, drawnCards } = data;

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

    prompt += `请解读这些牌与用户问题的关系，提供深入的分析和指导建议。
重要：请务必使用以下格式分节输出，每节标题用【】包裹：
【综合分析】
（整体解读内容）

【具体建议】
（行动建议，使用数字列表）

【需要注意】
（风险提示或注意事项）

【未来展望】
（趋势预测，如适用）

请用中文回答。`;
    return prompt;
  }
};

export default api;
