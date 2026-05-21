import { describe, it, expect, vi } from 'vitest';

const { mockBySolar } = vi.hoisted(() => {
  const palaceData = [
    { name: '命宫', majorStars: ['紫微', '天机'], minorStars: ['文昌'], adjectiveStars: ['天才'], mutagens: ['禄', '权'] },
    { name: '兄弟宫', majorStars: [], minorStars: [], adjectiveStars: ['天姚'], mutagens: [] },
    { name: '夫妻宫', majorStars: ['太阳'], minorStars: ['文曲'], adjectiveStars: [], mutagens: ['科'] },
    { name: '子女宫', majorStars: ['武曲', '天府'], minorStars: [], adjectiveStars: ['天寿'], mutagens: [] },
    { name: '财帛宫', majorStars: ['廉贞'], minorStars: ['擎羊'], adjectiveStars: [], mutagens: ['忌'] },
    { name: '疾厄宫', majorStars: ['天府'], minorStars: [], adjectiveStars: ['天哭'], mutagens: [] },
    { name: '迁移宫', majorStars: ['巨门', '太阳'], minorStars: ['铃星'], adjectiveStars: ['天殇'], mutagens: [] },
    { name: '交友宫', majorStars: ['天相'], minorStars: ['火星'], adjectiveStars: ['天空'], mutagens: [] },
    { name: '事业宫', majorStars: ['紫微', '贪狼'], minorStars: ['左辅'], adjectiveStars: ['天官'], mutagens: ['禄'] },
    { name: '田宅宫', majorStars: ['天同'], minorStars: [], adjectiveStars: ['天梭'], mutagens: [] },
    { name: '福德宫', majorStars: ['武曲', '破军'], minorStars: ['陀罗'], adjectiveStars: ['天福'], mutagens: [] },
    { name: '父母宫', majorStars: ['天机', '太阴'], minorStars: ['天魁'], adjectiveStars: ['天厨'], mutagens: [] }
  ];

  const bySolar = vi.fn((_birthday, _birthTime, _gender, _leapMonth, _locale) => ({
    soul: '紫微',
    body: '武曲',
    sign: '天蝎座',
    zodiac: '龙',
    fiveElementsClass: '木',
    palaces: palaceData.map(p => ({
      name: p.name,
      heavenlyStem: '甲',
      earthlyBranch: '子',
      majorStars: p.majorStars.map(name => ({ name })),
      minorStars: p.minorStars.map(name => ({ name })),
      adjectiveStars: p.adjectiveStars.map(name => ({ name })),
      changsheng12: '长生',
      isEmpty: () => p.majorStars.length === 0 && p.minorStars.length === 0,
      hasMutagen: m => p.mutagens.includes(m)
    }))
  }));

  return { mockBySolar: bySolar, mockPalaceData: palaceData };
});

vi.mock('iztro', () => ({
  astro: {
    bySolar: mockBySolar
  }
}));

import { generateZiweiData, formatZiweiPrompt } from '../../../utils/ziwei/ziweiData';

describe('Ziwei Data', () => {
  describe('generateZiweiData', () => {
    it('should return complete ziwei data structure', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');

      expect(result).toHaveProperty('basicInfo');
      expect(result).toHaveProperty('palaces');
    });

    it('should have 12 palaces', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      expect(result.palaces).toHaveLength(12);
    });

    it('should include basicInfo with all required fields', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');

      expect(result.basicInfo).toHaveProperty('birthday', '2000-08-16');
      expect(result.basicInfo).toHaveProperty('birthTime', '午');
      expect(result.basicInfo).toHaveProperty('gender', '男');
      expect(result.basicInfo).toHaveProperty('birthdayType', '阳历');
      expect(result.basicInfo).toHaveProperty('soul', '紫微');
      expect(result.basicInfo).toHaveProperty('body', '武曲');
      expect(result.basicInfo).toHaveProperty('sign', '天蝎座');
      expect(result.basicInfo).toHaveProperty('zodiac', '龙');
      expect(result.basicInfo).toHaveProperty('fiveElementsClass', '木');
    });

    it('should format gender as Chinese character', () => {
      const maleResult = generateZiweiData('2000-08-16', '午', 'male');
      const femaleResult = generateZiweiData('2000-08-16', '午', 'female');

      expect(maleResult.basicInfo.gender).toBe('男');
      expect(femaleResult.basicInfo.gender).toBe('女');
    });

    it('should format birthdayType as Chinese', () => {
      const solarResult = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const lunarResult = generateZiweiData('2000-08-16', '午', 'male', 'lunar');

      expect(solarResult.basicInfo.birthdayType).toBe('阳历');
      expect(lunarResult.basicInfo.birthdayType).toBe('农历');
    });

    it('each palace should have required fields', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');

      result.palaces.forEach((palace, index) => {
        expect(palace).toHaveProperty('index', index + 1);
        expect(palace).toHaveProperty('name');
        expect(palace).toHaveProperty('heavenlyStem');
        expect(palace).toHaveProperty('earthlyBranch');
        expect(palace).toHaveProperty('majorStars');
        expect(palace).toHaveProperty('minorStars');
        expect(palace).toHaveProperty('adjectiveStars');
        expect(palace).toHaveProperty('mutagens');
        expect(palace).toHaveProperty('changsheng12');
        expect(palace).toHaveProperty('isEmpty');
      });
    });

    it('should join star names with 、', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const firstPalace = result.palaces[0];

      expect(firstPalace.majorStars).toBe('紫微、天机');
      expect(firstPalace.minorStars).toBe('文昌');
      expect(firstPalace.adjectiveStars).toBe('天才');
    });

    it('should return 无 when no major or minor stars', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const secondPalace = result.palaces[1];

      expect(secondPalace.majorStars).toBe('无');
      expect(secondPalace.minorStars).toBe('无');
    });

    it('should handle mutagens correctly', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const firstPalace = result.palaces[0];
      const thirdPalace = result.palaces[2];

      expect(firstPalace.mutagens).toBe('禄、权');
      expect(thirdPalace.mutagens).toBe('科');
    });

    it('should return 无 when no mutagens', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const fourthPalace = result.palaces[3];

      expect(fourthPalace.mutagens).toBe('无');
    });

    it('palace index should be 1-12', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const indexes = result.palaces.map(p => p.index);

      expect(indexes).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('palace names should be correct', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const names = result.palaces.map(p => p.name);

      expect(names).toEqual([
        '命宫', '兄弟宫', '夫妻宫', '子女宫',
        '财帛宫', '疾厄宫', '迁移宫', '交友宫',
        '事业宫', '田宅宫', '福德宫', '父母宫'
      ]);
    });

    it('isEmpty should be boolean', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');

      result.palaces.forEach(palace => {
        expect(typeof palace.isEmpty).toBe('boolean');
      });
    });

    it('isEmpty should be true for palace with no major or minor stars', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const secondPalace = result.palaces.find(p => p.name === '兄弟宫');

      expect(secondPalace.isEmpty).toBe(true);
    });

    it('isEmpty should be false for palace with stars', () => {
      const result = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const firstPalace = result.palaces.find(p => p.name === '命宫');

      expect(firstPalace.isEmpty).toBe(false);
    });
  });

  describe('formatZiweiPrompt', () => {
    it('should return string', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should include basic info', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      expect(prompt).toContain('2000-08-16');
      expect(prompt).toContain('午');
      expect(prompt).toContain('男');
      expect(prompt).toContain('龙');
      expect(prompt).toContain('木');
    });

    it('should include soul and body', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      expect(prompt).toContain('命宫主星：紫微');
      expect(prompt).toContain('身宫主星：武曲');
    });

    it('should include all 12 palace names', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      const palaceNames = ['命宫', '兄弟宫', '夫妻宫', '子女宫', '财帛宫', '疾厄宫', '迁移宫', '交友宫', '事业宫', '田宅宫', '福德宫', '父母宫'];

      palaceNames.forEach(name => {
        expect(prompt).toContain(name);
      });
    });

    it('should include palace data fields', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      expect(prompt).toContain('天干地支');
      expect(prompt).toContain('主星');
      expect(prompt).toContain('辅星');
      expect(prompt).toContain('杂耀');
      expect(prompt).toContain('四化');
      expect(prompt).toContain('长生十二神');
    });

    it('should include header text', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      expect(prompt).toContain('【紫微斗数命盘数据】');
      expect(prompt).toContain('出生信息');
      expect(prompt).toContain('【十二宫数据】');
    });

    it('should format star names from palace data', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      expect(prompt).toContain('紫微');
      expect(prompt).toContain('天机');
    });

    it('should include mutagens', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      expect(prompt).toContain('禄');
      expect(prompt).toContain('权');
      expect(prompt).toContain('科');
    });

    it('prompt should be multiline', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      expect(prompt).toContain('\n');
    });
  });

  describe('integration', () => {
    it('generateZiweiData and formatZiweiPrompt should work together', () => {
      const ziweiData = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(ziweiData);

      expect(ziweiData.basicInfo.soul).toBe('紫微');
      expect(prompt).toContain('紫微');
      expect(prompt).toContain('2000-08-16');
    });

    it('should handle different genders', () => {
      const maleData = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const femaleData = generateZiweiData('2000-08-16', '午', 'female', 'solar');

      expect(maleData.basicInfo.gender).toBe('男');
      expect(femaleData.basicInfo.gender).toBe('女');

      const malePrompt = formatZiweiPrompt(maleData);
      const femalePrompt = formatZiweiPrompt(femaleData);

      expect(malePrompt).toContain('男');
      expect(femalePrompt).toContain('女');
    });

    it('should handle different birthday types in data', () => {
      const solarData = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const lunarData = generateZiweiData('2000-08-16', '午', 'male', 'lunar');

      expect(solarData.basicInfo.birthdayType).toBe('阳历');
      expect(lunarData.basicInfo.birthdayType).toBe('农历');
    });

    it('should produce non-empty prompt for all palaces', () => {
      const data = generateZiweiData('2000-08-16', '午', 'male', 'solar');
      const prompt = formatZiweiPrompt(data);

      data.palaces.forEach(palace => {
        expect(prompt).toContain(palace.name);
        expect(prompt).toContain(palace.heavenlyStem);
        expect(prompt).toContain(palace.earthlyBranch);
      });
    });

    it('should call iztro astro.bySolar with correct parameters', () => {
      generateZiweiData('2000-08-16', '午', 'male', 'solar');

      expect(mockBySolar).toHaveBeenCalledWith('2000-08-16', '午', 'male', true, 'zh-CN');
    });
  });
});
