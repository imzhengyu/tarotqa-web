# TarotQA 资源文档

## 1. 项目资源概览

本文档记录 TarotQA 项目中使用的所有资源及其来源。

---

## 2. 塔罗牌数据 (tarot-data.json)

### 2.1 数据来源

| 来源 | 说明 | 用途 |
|------|------|------|
| [fatemaster.ai](https://www.fatemaster.ai/tarot-cards) | 塔罗牌图片及基础牌义 | 主要图片来源 |
| Wikipedia Commons | Rider-Waite Smith 牌组图片 | 备用图片来源 |

### 2.2 数据结构

```json
{
  "source": "fatemaster.ai tarot cards data",
  "lastUpdated": "2026-03-20",
  "cards": [
    {
      "id": 0,
      "name": "愚者",
      "nameEn": "The_Fool",
      "arcana": "major",
      "suit": null,
      "number": 0,
      "imageUrl": "https://www.fatemaster.ai/images/tarot/major/00_Fool.jpg",
      "description": "正位描述...",
      "reversedDescription": "逆位描述...",
      "keywords": ["关键词1", "关键词2"],
      "element": null,
      "imageSource": "fatemaster.ai",
      "localPath": "tarot-images/major/00_Fool.jpg"
    }
  ]
}
```

### 2.3 牌卡分类

| 类别 | ID范围 | 数量 |
|------|--------|------|
| 大阿卡纳 (Major Arcana) | 0-21 | 22张 |
| 小阿卡纳 (Minor Arcana) | 22-77 | 56张 |
| - 权杖 (Wands) | 22-35 | 14张 |
| - 圣杯 (Cups) | 36-49 | 14张 |
| - 宝剑 (Swords) | 50-63 | 14张 |
| - 金币 (Pentacles) | 64-77 | 14张 |

---

## 3. 图片资源

### 3.1 本地图片 (当前使用)

**存储位置**: `web/public/tarot-images/`

| 类别 | 目录 | 数量 |
|------|------|------|
| 大阿卡纳 | `/tarot-images/major/` | 22张 |
| 小阿卡纳-权杖 | `/tarot-images/wands/` | 14张 |
| 小阿卡纳-圣杯 | `/tarot-images/cups/` | 14张 |
| 小阿卡纳-宝剑 | `/tarot-images/swords/` | 14张 |
| 小阿卡纳-金币 | `/tarot-images/pentacles/` | 14张 |

**加载方式**: 使用 `localPath` 字段，优先从本地加载

### 3.2 fatemaster.ai 图片 (远程备用)

**URL格式**: `https://www.fatemaster.ai/images/tarot/{category}/{filename}`

| 类别 | 路径格式 | 示例 |
|------|----------|------|
| 大阿卡纳 | `/images/tarot/major/{id}_{name}.jpg` | `/images/tarot/major/00_Fool.jpg` |
| 小阿卡纳-权杖 | `/images/tarot/minor/wands/{id}_{name}.jpg` | `/images/tarot/minor/wands/01_Wands.jpg` |
| 小阿卡纳-圣杯 | `/images/tarot/minor/cups/{id}_{name}.jpg` | `/images/tarot/minor/cups/01_Cups.jpg` |
| 小阿卡纳-宝剑 | `/images/tarot/minor/swords/{id}_{name}.jpg` | `/images/tarot/minor/swords/01_Swords.jpg` |
| 小阿卡纳-金币 | `/images/tarot/minor/pentacles/{id}_{name}.jpg` | `/images/tarot/minor/pentacles/01_Pentacles.jpg` |

### 3.3 Wikipedia Commons 图片 (备用)

**URL格式**: `https://commons.wikimedia.org/wiki/Special:FilePath/{CardName}.jpg`

Rider-Waite Smith 牌组，Public Domain。

### 3.4 图片加载优化

- 使用本地图片，加快加载速度
- 添加图片占位符，避免加载时白屏
- 使用 `loading="lazy"` 实现懒加载

---

## 4. 大阿卡纳牌卡列表 (22张)

| ID | 中文名 | 英文名 | 序号 |
|----|--------|--------|------|
| 0 | 愚者 | The Fool | I |
| 1 | 魔术师 | The Magician | II |
| 2 | 女祭司 | The High Priestess | III |
| 3 | 女皇 | The Empress | IV |
| 4 | 皇帝 | The Emperor | V |
| 5 | 教皇 | The Hierophant | VI |
| 6 | 恋人 | The Lovers | VII |
| 7 | 战车 | The Chariot | VIII |
| 8 | 力量 | Strength | IX |
| 9 | 隐士 | The Hermit | X |
| 10 | 命运之轮 | Wheel of Fortune | XI |
| 11 | 正义 | Justice | XII |
| 12 | 倒吊人 | The Hanged Man | XIII |
| 13 | 死神 | Death | XIV |
| 14 | 节制 | Temperance | XV |
| 15 | 恶魔 | The Devil | XVI |
| 16 | 塔 | The Tower | XVII |
| 17 | 星星 | The Star | XVIII |
| 18 | 月亮 | The Moon | XIX |
| 19 | 太阳 | The Sun | XX |
| 20 | 审判 | Judgement | XXI |
| 21 | 世界 | The World | XXII |

---

## 5. 小阿卡纳牌卡列表 (56张)

### 权杖 (Wands) - 火元素

| ID | 中文名 | 英文名 |
|----|--------|--------|
| 22 | 权杖王牌 | Ace of Wands |
| 23 | 权杖二 | Two of Wands |
| 24 | 权杖三 | Three of Wands |
| 25 | 权杖四 | Four of Wands |
| 26 | 权杖五 | Five of Wands |
| 27 | 权杖六 | Six of Wands |
| 28 | 权杖七 | Seven of Wands |
| 29 | 权杖八 | Eight of Wands |
| 30 | 权杖九 | Nine of Wands |
| 31 | 权杖十 | Ten of Wands |
| 32 | 权杖侍者 | Page of Wands |
| 33 | 权杖骑士 | Knight of Wands |
| 34 | 权杖皇后 | Queen of Wands |
| 35 | 权杖国王 | King of Wands |

### 圣杯 (Cups) - 水元素

| ID | 中文名 | 英文名 |
|----|--------|--------|
| 36 | 圣杯王牌 | Ace of Cups |
| 37 | 圣杯二 | Two of Cups |
| 38 | 圣杯三 | Three of Cups |
| 39 | 圣杯四 | Four of Cups |
| 40 | 圣杯五 | Five of Cups |
| 41 | 圣杯六 | Six of Cups |
| 42 | 圣杯七 | Seven of Cups |
| 43 | 圣杯八 | Eight of Cups |
| 44 | 圣杯九 | Nine of Cups |
| 45 | 圣杯十 | Ten of Cups |
| 46 | 圣杯侍者 | Page of Cups |
| 47 | 圣杯骑士 | Knight of Cups |
| 48 | 圣杯皇后 | Queen of Cups |
| 49 | 圣杯国王 | King of Cups |

### 宝剑 (Swords) - 风元素

| ID | 中文名 | 英文名 |
|----|--------|--------|
| 50 | 宝剑王牌 | Ace of Swords |
| 51 | 宝剑二 | Two of Swords |
| 52 | 宝剑三 | Three of Swords |
| 53 | 宝剑四 | Four of Swords |
| 54 | 宝剑五 | Five of Swords |
| 55 | 宝剑六 | Six of Swords |
| 56 | 宝剑七 | Seven of Swords |
| 57 | 宝剑八 | Eight of Swords |
| 58 | 宝剑九 | Nine of Swords |
| 59 | 宝剑十 | Ten of Swords |
| 60 | 宝剑侍者 | Page of Swords |
| 61 | 宝剑骑士 | Knight of Swords |
| 62 | 宝剑皇后 | Queen of Swords |
| 63 | 宝剑国王 | King of Swords |

### 金币 (Pentacles) - 土元素

| ID | 中文名 | 英文名 |
|----|--------|--------|
| 64 | 金币王牌 | Ace of Pentacles |
| 65 | 金币二 | Two of Pentacles |
| 66 | 金币三 | Three of Pentacles |
| 67 | 金币四 | Four of Pentacles |
| 68 | 金币五 | Five of Pentacles |
| 69 | 金币六 | Six of Pentacles |
| 70 | 金币七 | Seven of Pentacles |
| 71 | 金币八 | Eight of Pentacles |
| 72 | 金币九 | Nine of Pentacles |
| 73 | 金币十 | Ten of Pentacles |
| 74 | 金币侍者 | Page of Pentacles |
| 75 | 金币骑士 | Knight of Pentacles |
| 76 | 金币皇后 | Queen of Pentacles |
| 77 | 金币国王 | King of Pentacles |

---

## 6. 牌阵资源

### 6.1 内置牌阵

| 牌阵名称 | 牌数 | 说明 |
|----------|------|------|
| 单牌阵 | 1 | 快速简单占卜 |
| 三牌阵 | 3 | 过去-现在-未来 |
| 凯尔特十字牌阵 | 10 | 深度详细分析 |
| 爱情金字塔 | 4 | 情感专项 |
| 马蹄铁牌阵 | 7 | 运势综合分析 |

### 6.2 牌阵位置定义

详见 `src/pages/Divination.jsx` 中的 `spreads` 数组。

---

## 7. 技术资源

### 7.1 前端框架

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | UI框架 |
| Vite | 5.x | 构建工具 |
| React Router DOM | 6.x | 路由管理 |

### 7.2 样式

- CSS3 变量
- CSS 3D Transform (翻牌动画)
- CSS Animation (悬浮、加载效果)

---

## 8. 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-03-20 | 初始资源文档 |
| 2026-03-20 | 添加fatemaster.ai图片URL |
| 2026-03-20 | 添加正位/逆位描述数据 |
| 2026-03-20 | 更新图片加载优化 |
| 2026-03-20 | 修复localPath与实际文件名匹配 |
| 2026-03-20 | 添加本地图片至web/public/tarot-images/ |

---

*文档版本：v1.1*
*最后更新：2026-03-20 21:56:34*
