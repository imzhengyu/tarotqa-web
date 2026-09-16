import { astro } from 'iztro';

/**
 * 出生小时 → iztro 的时辰序号【0~12】。
 *
 * iztro 的 TIME_RANGE 为：
 *   0: 00:00~01:00 早子时 · 1: 01:00~03:00 丑时 · … · 11: 21:00~23:00 亥时 · 12: 23:00~00:00 晚子时
 * 所以 23 点属于晚子时（12），而不是亥时（11）——旧实现用 `Math.floor(hour / 2) % 12`
 * 会把 23:00 算成亥时，且 0 点与 1 点的归属也与 iztro 的区间不一致。
 */
export function hourToTimeIndex(hour) {
  const value = Number(hour);
  if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 23) {
    throw new Error(`出生小时必须是 0-23 的整数：${hour}`);
  }
  return value === 23 ? 12 : Math.ceil(value / 2);
}

/**
 * 生成紫微斗数命盘完整数据用于 AI 分析
 */
export function generateZiweiData(birthday, birthTime, gender, birthdayType = 'solar') {
  // 数字按小时换算成 iztro 的时辰序号；字符串视为调用方已换算好的序号/名称
  const timePeriod = typeof birthTime === 'number' ? hourToTimeIndex(birthTime) : birthTime;

  // 使用 iztro 生成命盘数据
  const astrolabe = astro.bySolar(birthday, timePeriod, gender, true, 'zh-CN');

  // 格式化宫位数据
  const palaces = astrolabe.palaces.map((palace, index) => {
    const majorStarNames = palace.majorStars.map(s => s.name).join('、');
    const minorStarNames = palace.minorStars.map(s => s.name).join('、');
    const adjectiveStarNames = palace.adjectiveStars.map(s => s.name).join('、');

    // 获取四化信息
    const mutagens = [];
    if (palace.hasMutagen('禄')) mutagens.push('禄');
    if (palace.hasMutagen('权')) mutagens.push('权');
    if (palace.hasMutagen('科')) mutagens.push('科');
    if (palace.hasMutagen('忌')) mutagens.push('忌');

    return {
      index: index + 1,
      name: palace.name,
      heavenlyStem: palace.heavenlyStem,
      earthlyBranch: palace.earthlyBranch,
      majorStars: majorStarNames || '无',
      minorStars: minorStarNames || '无',
      adjectiveStars: adjectiveStarNames || '无',
      mutagens: mutagens.length > 0 ? mutagens.join('、') : '无',
      changsheng12: palace.changsheng12,
      isEmpty: palace.isEmpty()
    };
  });

  return {
    basicInfo: {
      birthday,
      birthTime,
      gender: gender === 'male' ? '男' : '女',
      birthdayType: birthdayType === 'lunar' ? '农历' : '阳历',
      soul: astrolabe.soul,
      body: astrolabe.body,
      sign: astrolabe.sign,
      zodiac: astrolabe.zodiac,
      fiveElementsClass: astrolabe.fiveElementsClass
    },
    palaces
  };
}

/**
 * 格式化命盘数据为 AI 输入文本
 */
export function formatZiweiPrompt(data) {
  const { basicInfo, palaces } = data;

  let prompt = `【紫微斗数命盘数据】

出生信息：
- 阳历生日：${basicInfo.birthday}
- 出生时辰：${basicInfo.birthTime}时
- 性别：${basicInfo.gender}
- 生肖：${basicInfo.zodiac}
- 五行：${basicInfo.fiveElementsClass}

命宫主星：${basicInfo.soul}
身宫主星：${basicInfo.body}

【十二宫数据】

`;

  palaces.forEach(palace => {
    const emptyTag = palace.isEmpty ? '（空宫）' : '';
    prompt += `${palace.name}${emptyTag}
- 天干地支：${palace.heavenlyStem}${palace.earthlyBranch}
- 主星：${palace.majorStars}
- 辅星：${palace.minorStars}
- 杂耀：${palace.adjectiveStars}
- 四化：${palace.mutagens}
- 长生十二神：${palace.changsheng12}

`;
  });

  return prompt;
}
