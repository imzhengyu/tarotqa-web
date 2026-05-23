// 本地数据加载服务 - 纯前端无需后端
import tarotData from '../../../resources/tarot-data.json';
import { spreads, getRecommendedPersona as getSpreadPersona } from '../data/spreads';
import { personas, getPersona } from '../data/personas';
import { AI_CONFIG } from '../constants';

// 辅助函数：获取 API Key
const _getApiKey = () => {
  try {
    const key = localStorage.getItem('minimax_api_key');
    if (key) return key;
  } catch (e) {
    console.warn('[API] localStorage 读取失败:', e.message);
  }
  return import.meta.env.VITE_DEFAULT_API_KEY;
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
  // 检查 choice 结构
  if (!choice || typeof choice !== 'object') {
    throw new Error('AI 响应内容解析失败: 无效的响应结构');
  }

  console.log('[DEBUG] _extractAIContent 收到的 choice keys:', Object.keys(choice));

  // 尝试从 messages 数组提取
  if (choice.messages && Array.isArray(choice.messages)) {
    const content = choice.messages.map(m => m.role === 'assistant' ? m.content : '').join('');
    console.log('[DEBUG] 从 messages 提取内容:', content ? `${content.substring(0, 100)}...` : '(空)');
    return content;
  }

  // 尝试从 delta.content 提取（流式响应）
  if (choice.delta?.content) {
    console.log('[DEBUG] 从 delta.content 提取内容');
    return choice.delta.content;
  }

  // 优先使用 content 字段（最终结果）
  if (choice.message?.content) {
    console.log('[DEBUG] 从 message.content 提取内容:', choice.message.content.substring(0, 100));
    return choice.message.content;
  }

  // 如果 content 为空，使用 reasoning_content（思考过程）
  if (choice.message?.reasoning_content) {
    console.log('[DEBUG] 从 message.reasoning_content 提取内容:', choice.message.reasoning_content.substring(0, 100));
    return choice.message.reasoning_content;
  }

  // 尝试其他可能的格式
  if (choice.message?.reply) {
    console.log('[DEBUG] 从 message.reply 提取内容');
    return choice.message.reply;
  }

  if (choice.content) {
    console.log('[DEBUG] 从 choice.content 提取内容');
    return choice.content;
  }

  // 如果仍然没有内容，抛出详细错误
  console.error('[DEBUG] AI 响应内容解析失败，choice 完整结构:', JSON.stringify(choice).substring(0, 500));
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
      throw new Error('网络连接失败，请检查网络后重试', { cause: networkError });
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
      throw new Error('服务器响应格式错误，请稍后重试', { cause: parseError });
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
    const { question, selectedSpread, language = 'zh' } = data;

    // 获取合适的角色
    const persona = this.getRecommendedPersona(selectedSpread?.id, question);
    const systemPrompt = language === 'zh' ? persona.description : persona.descriptionEn || persona.description;

    const userContent = this.buildTarotPrompt(data);

    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];
  },

  buildTarotPrompt(data) {
    const { question, selectedSpread, drawnCards, language = 'zh' } = data;

    if (language === 'en') {
      // English prompt
      let prompt = `Spread: ${selectedSpread.nameEn || selectedSpread.name}\n`;
      prompt += `Question: ${question || 'General Fortune'}\n\n`;
      prompt += `Cards drawn:`;

      drawnCards.forEach((card, idx) => {
        const positionName = selectedSpread.positions?.[idx]?.nameEn || selectedSpread.positions?.[idx]?.name || `Position ${idx + 1}`;
        const pos = card.isReversed ? 'Reversed' : 'Upright';
        const keywords = card.keywordsEn?.slice(0, 3).join(', ') || card.keywords?.slice(0, 3).join(', ') || '';
        prompt += `\n${idx + 1}. ${positionName}: ${card.nameEn || card.name} (${pos}) ${keywords}`;
        if (idx < drawnCards.length - 1) prompt += ' | ';
      });

      prompt += `\n\nPlease analyze the relationship between these cards and the question. Respond in English using Markdown format.`;
      return prompt;
    }

    // Chinese prompt (default)
    let prompt = `牌阵：${selectedSpread.name}\n`;
    prompt += `问题：${question || '整体运势'}\n\n`;
    prompt += `抽牌：`;

    drawnCards.forEach((card, idx) => {
      const positionName = selectedSpread.positions?.[idx]?.name || `位${idx + 1}`;
      const pos = card.isReversed ? '逆' : '正';
      const keywords = card.keywords?.slice(0, 3).join(', ') || '';
      prompt += `${idx + 1}.${positionName}:${card.name}(${pos}) ${keywords}`;
      if (idx < drawnCards.length - 1) prompt += ' | ';
    });

    prompt += `\n\n简析这些牌与问题的关系，用Markdown格式回答。`;
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
  },

  // AI 紫微斗数命盘解读
  async getAIZiweiInterpretation(birthData) {
    const apiKey = _getApiKey();
    const language = birthData.language || 'zh';

    if (!apiKey) {
      throw new Error(language === 'zh' ? '请先在设置中配置 MiniMax API Key' : 'Please configure MiniMax API Key in settings');
    }

    // 错误场景2: API Key 格式无效
    if (!apiKey.startsWith('sk-') && !apiKey.startsWith('eyJ')) {
      console.error('[AI紫微解读] 无效的 API Key 格式:', apiKey.substring(0, 10) + '...');
      throw new Error(language === 'zh' ? 'API Key 格式无效，请检查设置' : 'Invalid API Key format');
    }

    const { birthday, birthTime, gender, birthdayType, ziweiData } = birthData;

    const systemPrompt = language === 'zh'
      ? `你是一位专业的紫微斗数命理师，精通紫微斗数各宫含义、星曜特性、四化飞星以及三方四正关系。你需要根据命盘数据给出专业、准确、有洞察力的分析。请用中文回答，以 Markdown 格式输出。`
      : `You are a professional Ziwei Dou Shu fortune teller, proficient in the meaning of each palace, star characteristics, Si Hua flying stars, and San Fang Si Zheng relationships. Provide professional, accurate, and insightful analysis based on the chart data. Respond in English using Markdown format.`;

    let userContent;
    if (ziweiData) {
      userContent = language === 'zh'
        ? `请分析以下详细的紫微斗数命盘数据：

${ziweiData}

请给出详细的命盘分析，包括：
1. 命宫特点与性格分析
2. 身宫对命主的影响
3. 主要星曜分布与组合分析
4. 四化飞星详细分析（禄权科忌）
5. 事业、财运、感情方面的发展建议

请用专业但亲切的语气给出分析。请直接给出分析结果，不要包含思考过程。`
        : `Please analyze the following detailed Ziwei Dou Shu chart data:

${ziweiData}

Provide detailed chart analysis including:
1. Ming Gong characteristics and personality analysis
2. Shen Gong's influence on the person
3. Main star distribution and combination analysis
4. Detailed Si Hua flying star analysis (Lu, Quan, Ke, Ji)
5. Development suggestions for career, wealth, and relationships

Use professional yet friendly tone. Provide analysis directly without including thinking process.`;
    } else {
      userContent = language === 'zh'
        ? `请分析以下紫微斗数命盘：

出生信息：
- 阳历生日：${birthday}
- 出生时辰：${birthTime}时
- 性别：${gender === 'male' ? '男' : '女'}
- 排盘类型：${birthdayType === 'lunar' ? '农历' : '阳历'}

请给出详细的命盘分析，包括：
1. 命宫特点
2. 主要星曜分布
3. 四化飞星分析
4. 事业、财运、感情方面的发展建议

请用专业但亲切的语气给出分析。请直接给出分析结果，不要包含思考过程。`
        : `Please analyze the following Ziwei Dou Shu chart:

Birth Information:
- Solar Birthday: ${birthday}
- Birth Hour: ${birthTime} o'clock
- Gender: ${gender === 'male' ? 'Male' : 'Female'}
- Chart Type: ${birthdayType === 'lunar' ? 'Lunar' : 'Solar'}

Provide detailed chart analysis including:
1. Ming Gong characteristics
2. Main star distribution
3. Si Hua flying star analysis
4. Development suggestions for career, wealth, and relationships

Use professional yet friendly tone. Provide analysis directly without including thinking process.`;
    }

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

    console.log('[AI紫微解读] 发送请求:', {
      url: AI_CONFIG.API_URL,
      model: requestBody.model,
      birthday,
      birthTime,
      gender,
      birthdayType
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
      console.error('[AI紫微解读] 网络错误:', networkError);
      throw new Error('网络连接失败，请检查网络后重试', { cause: networkError });
    }

    // 错误场景4: HTTP 状态码错误
    if (!response.ok) {
      let errorMsg = 'API 请求失败';
      try {
        const errorData = await response.json();
        console.error('[AI紫微解读] API 错误响应:', errorData);
        errorMsg = _getErrorMessageFromStatus(response, errorData);
      } catch {
        // ignore parse error
      }
      throw new Error(errorMsg);
    }

    // 错误场景5: 响应格式解析失败
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      console.error('[AI紫微解读] 解析响应 JSON 失败:', parseError);
      throw new Error('服务器响应格式错误，请稍后重试', { cause: parseError });
    }

    console.log('[AI紫微解读] 响应结构:', Object.keys(result));
    console.log('[AI紫微解读] 完整响应:', JSON.stringify(result, null, 2).substring(0, 2000));

    // 检查是否有 API 错误
    if (result.base_resp && result.base_resp.status_code !== 0) {
      console.error('[AI紫微解读] API 错误:', result.base_resp);
      throw new Error(result.base_resp.status_msg || 'API 请求失败');
    }

    // 错误场景6: 响应中缺少必要字段
    if (!result.choices || !Array.isArray(result.choices) || result.choices.length === 0) {
      console.error('[AI紫微解读] 无效的响应结构:', result);
      throw new Error('AI 响应格式错误，请稍后重试');
    }

    const choice = result.choices[0];
    console.log('[AI紫微解读] choice:', choice);
    console.log('[AI紫微解读] choice 结构:', JSON.stringify(choice, null, 2).substring(0, 2000));
    console.log('[AI紫微解读] choice.keys:', Object.keys(choice));
    console.log('[AI紫微解读] choice.message keys:', Object.keys(choice.message || {}));
    console.log('[AI紫微解读] choice.message.content 长度:', choice.message?.content?.length);
    console.log('[AI紫微解读] choice.message.reasoning_content 长度:', choice.message?.reasoning_content?.length);
    console.log('[AI紫微解读] choice.messages:', choice.messages);
    console.log('[AI紫微解读] choice.delta:', choice.delta);

    if (!choice.finish_reason && !choice.messages) {
      console.error('[AI紫微解读] 无效的 choice 结构:', choice);
      throw new Error('AI 响应格式错误，请稍后重试');
    }

    // 提取 AI 回复内容
    let aiContent;
    try {
      aiContent = _extractAIContent(choice);
    } catch (err) {
      console.error('[AI紫微解读] 无法提取内容, choice:', choice, '错误:', err);
      throw err;
    }

    if (!aiContent || aiContent.trim() === '') {
      console.warn('[AI紫微解读] AI 返回空内容');
      throw new Error('AI 暂时无法提供解读，请稍后重试');
    }

    console.log('[AI紫微解读] 成功获取回复, 长度:', aiContent.length);
    return aiContent.trim();
  },

  // AI 西方星盘解读
  async getAIAstrologyInterpretation(chartData, language = 'zh') {
    const apiKey = _getApiKey();
    if (!apiKey) {
      throw new Error(language === 'zh' ? '请先在设置中配置 MiniMax API Key' : 'Please configure MiniMax API Key in settings');
    }

    const { planets, ascendant, midheaven, birthData } = chartData;

    const systemPrompt = language === 'zh'
      ? `你是一位专业的西方占星师，精通十二星座、行星相位、宫位含义以及星盘综合分析。你需要根据星盘数据给出专业、准确、有洞察力的分析。请用中文回答，以 Markdown 格式输出。`
      : `You are a professional Western astrologer, proficient in the twelve zodiac signs, planetary aspects, house meanings, and comprehensive chart analysis. Provide professional, accurate, and insightful analysis based on the chart data. Respond in English using Markdown format.`;

    const sunPlanet = planets.find(p => p.id === 'sun');
    const moonPlanet = planets.find(p => p.id === 'moon');

    const userContent = language === 'zh'
      ? `请分析以下西方星盘：

出生信息：
- 出生日期：${birthData.year}年${birthData.month}月${birthData.day}日
- 出生时间：${String(birthData.hour).padStart(2, '0')}:${String(birthData.minute).padStart(2, '0')}

星盘数据：
- 太阳星座：${sunPlanet?.sign?.name || '未知'} ${sunPlanet ? Math.round(sunPlanet.degree) + '°' : ''}
- 月亮星座：${moonPlanet?.sign?.name || '未知'} ${moonPlanet ? Math.round(moonPlanet.degree) + '°' : ''}
- 上升星座：${ascendant?.sign?.name || '未知'} ${ascendant ? Math.round(ascendant.degree) + '°' : ''}
- 天顶星座：${midheaven?.sign?.name || '未知'}

行星分布：
${planets.map(p => `- ${p.name}：${p.sign?.name} ${Math.round(p.degree)}°`).join('\n')}

请给出详细的星盘分析，包括：
1. 太阳星座特点
2. 月亮星座特点
3. 上升星座对外表现
4. 主要行星相位分析
5. 事业、感情、财运方面的发展建议

请用专业但亲切的语气给出分析。`
      : `Please analyze the following Western astrology chart:

Birth Information:
- Birth Date: ${birthData.year}/${birthData.month}/${birthData.day}
- Birth Time: ${String(birthData.hour).padStart(2, '0')}:${String(birthData.minute).padStart(2, '0')}

Chart Data:
- Sun Sign: ${sunPlanet?.sign?.name || 'Unknown'} ${sunPlanet ? Math.round(sunPlanet.degree) + '°' : ''}
- Moon Sign: ${moonPlanet?.sign?.name || 'Unknown'} ${moonPlanet ? Math.round(moonPlanet.degree) + '°' : ''}
- Ascendant: ${ascendant?.sign?.name || 'Unknown'} ${ascendant ? Math.round(ascendant.degree) + '°' : ''}
- Midheaven: ${midheaven?.sign?.name || 'Unknown'}

Planet Distribution:
${planets.map(p => `- ${p.name}: ${p.sign?.name} ${Math.round(p.degree)}°`).join('\n')}

Provide detailed chart analysis including:
1. Sun sign characteristics
2. Moon sign characteristics
3. Ascendant's external presentation
4. Main planetary aspect analysis
5. Development suggestions for career, relationships, and wealth

Use professional yet friendly tone.`;

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
    } catch (err) {
      console.error('[AI星盘解读] 内容提取失败:', err.message, 'choice:', JSON.stringify(choice).substring(0, 300));
      const error = new Error('AI 暂时无法提供解读，请稍后重试');
      error.cause = err;
      throw error;
    }

    if (!aiContent || aiContent.trim() === '') {
      console.error('[AI星盘解读] AI 返回空内容，原始提取结果:', aiContent);
      throw new Error('AI 暂时无法提供解读，请稍后重试');
    }

    return aiContent.trim();
  }
};

export default api;
