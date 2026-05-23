// 塔罗牌阵配置 - 统一管理（双语）
import { PERSONA_IDS } from '../constants';

export const spreads = {
  single: {
    id: 'single',
    name: '单牌阵',
    nameEn: 'Single Card',
    cardCount: 1,
    description: '快速简单，适合简单问题',
    descriptionEn: 'Quick and simple, for simple questions',
    positions: [
      { name: '核心', nameEn: 'Core', description: '问题的核心', descriptionEn: 'Core of the matter' }
    ]
  },
  'three-cards': {
    id: 'three-cards',
    name: '三牌阵',
    nameEn: 'Three Cards',
    cardCount: 3,
    description: '过去-现在-未来时间线',
    descriptionEn: 'Past-Present-Future timeline',
    positions: [
      { name: '过去', nameEn: 'Past', description: '影响现状的过去因素', descriptionEn: 'Past factors affecting the present' },
      { name: '现在', nameEn: 'Present', description: '目前的状况', descriptionEn: 'Current situation' },
      { name: '未来', nameEn: 'Future', description: '可能的发展方向', descriptionEn: 'Possible future direction' }
    ]
  },
  celtic_cross: {
    id: 'celtic_cross',
    name: '凯尔特十字',
    nameEn: 'Celtic Cross',
    cardCount: 10,
    description: '深度详细分析',
    descriptionEn: 'In-depth detailed analysis',
    positions: [
      { name: '核心', nameEn: 'Core', description: '问题的核心', descriptionEn: 'Core of the matter' },
      { name: '障碍', nameEn: 'Obstacle', description: '面临的挑战', descriptionEn: 'Challenges faced' },
      { name: '基础', nameEn: 'Foundation', description: '问题的根基', descriptionEn: 'Foundation of the issue' },
      { name: '过去', nameEn: 'Past', description: '过去的经历', descriptionEn: 'Past experiences' },
      { name: '可能', nameEn: 'Possibility', description: '可能的发展', descriptionEn: 'Possible development' },
      { name: '未来', nameEn: 'Future', description: '近期的结果', descriptionEn: 'Near-term outcome' },
      { name: '自我', nameEn: 'Self', description: '问者心态', descriptionEn: 'Querent\'s mindset' },
      { name: '环境', nameEn: 'Surroundings', description: '周围环境', descriptionEn: 'Surrounding environment' },
      { name: '希望', nameEn: 'Hope', description: '希望与恐惧', descriptionEn: 'Hopes and fears' },
      { name: '结果', nameEn: 'Outcome', description: '最终结果', descriptionEn: 'Final outcome' }
    ]
  },
  'love-pyramid': {
    id: 'love-pyramid',
    name: '爱情金字塔',
    nameEn: 'Love Pyramid',
    cardCount: 4,
    description: '情感专项分析',
    descriptionEn: 'Love-specific analysis',
    positions: [
      { name: '顶部', nameEn: 'Top', description: '感情的核心', descriptionEn: 'Core of the relationship' },
      { name: '左侧', nameEn: 'Left', description: '你的心态', descriptionEn: 'Your mindset' },
      { name: '右侧', nameEn: 'Right', description: '对方心态', descriptionEn: 'Their mindset' },
      { name: '底部', nameEn: 'Bottom', description: '关系的发展', descriptionEn: 'Relationship development' }
    ]
  },
  horseshoe: {
    id: 'horseshoe',
    name: '马蹄铁',
    nameEn: 'Horseshoe',
    cardCount: 7,
    description: '运势综合分析',
    descriptionEn: 'Comprehensive fortune analysis',
    positions: [
      { name: '过去', nameEn: 'Past', description: '过去的经历', descriptionEn: 'Past experiences' },
      { name: '现在', nameEn: 'Present', description: '目前状况', descriptionEn: 'Current situation' },
      { name: '未来', nameEn: 'Future', description: '可能的结果', descriptionEn: 'Possible outcome' },
      { name: '障碍', nameEn: 'Obstacle', description: '面临的障碍', descriptionEn: 'Obstacles faced' },
      { name: '环境', nameEn: 'Environment', description: '周围环境', descriptionEn: 'Surrounding environment' },
      { name: '希望', nameEn: 'Hope', description: '希望与期待', descriptionEn: 'Hopes and expectations' },
      { name: '结果', nameEn: 'Outcome', description: '最终结果', descriptionEn: 'Final outcome' }
    ]
  }
};

// 根据牌阵ID获取推荐角色
export const getRecommendedPersona = (spreadId, question) => {
  const keywordMap = {
    [PERSONA_IDS.CAREER]: ['工作', '事业', '跳槽', '面试', '职场', '职业', '创业', '辞职', '加薪', '晋升'],
    [PERSONA_IDS.LOVE]: ['爱情', '感情', '恋人', '复合', '桃花', '婚姻', '约会', '暗恋', '表白', '分手'],
    [PERSONA_IDS.FINANCE]: ['金钱', '财富', '投资', '理财', '财运', '财务', '收入', '债务', '债务', '赚钱'],
    [PERSONA_IDS.DECISION]: ['选择', '决定', '纠结', '两难', '犹豫', '决策'],
    [PERSONA_IDS.FORTUNE]: ['运势', '运气', '未来', '趋势', '年度', '月份']
  };

  const spreadPersonaMap = {
    'single': PERSONA_IDS.GENERAL,
    'three-cards': PERSONA_IDS.GENERAL,
    'celtic_cross': PERSONA_IDS.DECISION,
    'love-pyramid': PERSONA_IDS.LOVE,
    'horseshoe': PERSONA_IDS.FORTUNE
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
