// Astrology constants

export const ZODIAC_SIGNS = [
  { id: 'aries', name: '白羊座', nameEn: 'Aries', symbol: '♈', element: '火', elementEn: 'Fire', modality: '本位', modalityEn: 'Cardinal' },
  { id: 'taurus', name: '金牛座', nameEn: 'Taurus', symbol: '♉', element: '土', elementEn: 'Earth', modality: '固定', modalityEn: 'Fixed' },
  { id: 'gemini', name: '双子座', nameEn: 'Gemini', symbol: '♊', element: '风', elementEn: 'Air', modality: '变动', modalityEn: 'Mutable' },
  { id: 'cancer', name: '巨蟹座', nameEn: 'Cancer', symbol: '♋', element: '水', elementEn: 'Water', modality: '本位', modalityEn: 'Cardinal' },
  { id: 'leo', name: '狮子座', nameEn: 'Leo', symbol: '♌', element: '火', elementEn: 'Fire', modality: '固定', modalityEn: 'Fixed' },
  { id: 'virgo', name: '处女座', nameEn: 'Virgo', symbol: '♍', element: '土', elementEn: 'Earth', modality: '变动', modalityEn: 'Mutable' },
  { id: 'libra', name: '天秤座', nameEn: 'Libra', symbol: '♎', element: '风', elementEn: 'Air', modality: '本位', modalityEn: 'Cardinal' },
  { id: 'scorpio', name: '天蝎座', nameEn: 'Scorpio', symbol: '♏', element: '水', elementEn: 'Water', modality: '固定', modalityEn: 'Fixed' },
  { id: 'sagittarius', name: '射手座', nameEn: 'Sagittarius', symbol: '♐', element: '火', elementEn: 'Fire', modality: '变动', modalityEn: 'Mutable' },
  { id: 'capricorn', name: '摩羯座', nameEn: 'Capricorn', symbol: '♑', element: '土', elementEn: 'Earth', modality: '本位', modalityEn: 'Cardinal' },
  { id: 'aquarius', name: '水瓶座', nameEn: 'Aquarius', symbol: '♒', element: '风', elementEn: 'Air', modality: '固定', modalityEn: 'Fixed' },
  { id: 'pisces', name: '双鱼座', nameEn: 'Pisces', symbol: '♓', element: '水', elementEn: 'Water', modality: '变动', modalityEn: 'Mutable' }
];

export const PLANETS = [
  { id: 'sun', name: '太阳', nameEn: 'Sun', symbol: '☉', isOuter: false },
  { id: 'moon', name: '月亮', nameEn: 'Moon', symbol: '☽', isOuter: false },
  { id: 'mercury', name: '水星', nameEn: 'Mercury', symbol: '☿', isOuter: false },
  { id: 'venus', name: '金星', nameEn: 'Venus', symbol: '♀', isOuter: false },
  { id: 'mars', name: '火星', nameEn: 'Mars', symbol: '♂', isOuter: false },
  { id: 'jupiter', name: '木星', nameEn: 'Jupiter', symbol: '♃', isOuter: true },
  { id: 'saturn', name: '土星', nameEn: 'Saturn', symbol: '♄', isOuter: true },
  { id: 'uranus', name: '天王星', nameEn: 'Uranus', symbol: '♅', isOuter: true },
  { id: 'neptune', name: '海王星', nameEn: 'Neptune', symbol: '♆', isOuter: true },
  { id: 'pluto', name: '冥王星', nameEn: 'Pluto', symbol: '♇', isOuter: true }
];

export const ASPECTS = [
  { id: 'conjunction', name: '合相', angle: 0, orb: 10, symbol: '☌' },
  { id: 'opposition', name: '冲相位', angle: 180, orb: 10, symbol: '☍' },
  { id: 'trine', name: '三分相', angle: 120, orb: 8, symbol: '△' },
  { id: 'square', name: '四分相', angle: 90, orb: 8, symbol: '□' },
  { id: 'sextile', name: '六分相', angle: 60, orb: 6, symbol: '✶' }
];

export const HOUSES = [
  { id: 1, name: '第一宫', alias: '命宫' },
  { id: 2, name: '第二宫', alias: '财帛宫' },
  { id: 3, name: '第三宫', alias: '兄弟宫' },
  { id: 4, name: '第四宫', alias: '田宅宫' },
  { id: 5, name: '第五宫', alias: '子女宫' },
  { id: 6, name: '第六宫', alias: '奴仆宫' },
  { id: 7, name: '第七宫', alias: '夫妻宫' },
  { id: 8, name: '第八宫', alias: '疾厄宫' },
  { id: 9, name: '第九宫', alias: '迁移宫' },
  { id: 10, name: '第十宫', alias: '官禄宫' },
  { id: 11, name: '第十一宫', alias: '福德宫' },
  { id: 12, name: '第十二宫', alias: '玄秘宫' }
];

export const PLANET_COLORS = {
  sun: '#FFD700',
  moon: '#C0C0C0',
  mercury: '#B8860B',
  venus: '#E6B800',
  mars: '#FF4500',
  jupiter: '#FFA500',
  saturn: '#8B4513',
  uranus: '#40E0D0',
  neptune: '#4169E1',
  pluto: '#800080'
};
