// 塔罗牌阵配置 - 统一管理
export const spreads = {
  single: {
    id: 'single',
    name: '单牌阵',
    cardCount: 1,
    description: '快速简单，适合简单问题',
    positions: [
      { name: '核心', description: '问题的核心' }
    ]
  },
  'three-cards': {
    id: 'three-cards',
    name: '三牌阵',
    cardCount: 3,
    description: '过去-现在-未来时间线',
    positions: [
      { name: '过去', description: '影响现状的过去因素' },
      { name: '现在', description: '目前的状况' },
      { name: '未来', description: '可能的发展方向' }
    ]
  },
  celtic_cross: {
    id: 'celtic_cross',
    name: '凯尔特十字',
    cardCount: 10,
    description: '深度详细分析',
    positions: [
      { name: '核心', description: '问题的核心' },
      { name: '障碍', description: '面临的挑战' },
      { name: '基础', description: '问题的根基' },
      { name: '过去', description: '过去的经历' },
      { name: '可能', description: '可能的发展' },
      { name: '未来', description: '近期的结果' },
      { name: '自我', description: '问者心态' },
      { name: '环境', description: '周围环境' },
      { name: '希望', description: '希望与恐惧' },
      { name: '结果', description: '最终结果' }
    ]
  },
  'love-pyramid': {
    id: 'love-pyramid',
    name: '爱情金字塔',
    cardCount: 4,
    description: '情感专项分析',
    positions: [
      { name: '顶部', description: '感情的核心' },
      { name: '左侧', description: '你的心态' },
      { name: '右侧', description: '对方心态' },
      { name: '底部', description: '关系的发展' }
    ]
  },
  horseshoe: {
    id: 'horseshoe',
    name: '马蹄铁',
    cardCount: 7,
    description: '运势综合分析',
    positions: [
      { name: '过去', description: '过去的经历' },
      { name: '现在', description: '目前状况' },
      { name: '未来', description: '可能的结果' },
      { name: '障碍', description: '面临的障碍' },
      { name: '环境', description: '周围环境' },
      { name: '希望', description: '希望与期待' },
      { name: '结果', description: '最终结果' }
    ]
  }
};

// 根据牌阵ID获取推荐角色
export const getRecommendedPersona = (spreadId, question) => {
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
        return personaId;
      }
    }
  }

  // 其次按牌阵类型选择
  if (spreadId && spreadPersonaMap[spreadId]) {
    return spreadPersonaMap[spreadId];
  }

  // 默认使用综合顾问
  return 'general';
};

export default spreads;
