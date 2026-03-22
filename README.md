# TarotQA - AI塔罗占卜平台

纯前端静态Web应用，提供塔罗牌占卜服务。无需安装，直接在浏览器中使用。

**在线体验**：https://imzhengyu.github.io/tarotqa-web/

## 功能特性

- **78张完整塔罗牌**：大阿卡纳22张 + 小阿卡纳56张
- **5种牌阵**：单牌、三牌、凯尔特十字、爱情金字塔、马蹄铁
- **正位/逆位**：每张牌50%概率出现逆位，牌义解读不同
- **每日运势**：十二星座每日运势，包含综合、爱情、事业、财运
- **AI深度解读**：集成 MiniMax API，支持Markdown渲染

## 技术栈

- React 18 + Vite 5
- React Router DOM 6
- markdown-it + DOMPurify
- dayjs
- Vitest

## 项目结构

```
tarotqa-web/
├── web/
│   ├── public/tarot-images/  # 78张塔罗牌本地图片
│   ├── src/
│   │   ├── components/       # TarotCard, Layout, PieChart, ErrorBoundary
│   │   ├── pages/           # Home, Divination, Cards, Horoscope, Statistics, Profile
│   │   ├── hooks/           # useDevice, useIntersectionObserver, useVisitStats
│   │   ├── services/        # api.js
│   │   ├── data/            # spreads.js, personas.js
│   │   ├── styles/          # global.css
│   │   └── tests/           # Vitest 测试
│   └── index.html
├── resources/
│   ├── tarot-data.json      # 78张塔罗牌数据
│   └── tarot-personas.md     # AI角色设定
├── dist/                    # 构建产物
├── CLAUDE.md                # 开发指南
├── CR.md                    # 代码审查
├── test.md                  # 测试计划
└── README.md
```

## 快速开始

```bash
cd web
npm install
npm run dev        # 开发服务器 (localhost:3000)
npm run build      # 生产构建
npm run preview    # 预览构建
npm run lint       # ESLint 检查
npm run test       # 测试（监视模式）
npm run test:run   # 测试（单次）
```

## 牌阵说明

| 牌阵 | 牌数 | 说明 |
|------|------|------|
| 单牌阵 | 1 | 快速简单占卜 |
| 三牌阵 | 3 | 过去/现在/未来 |
| 凯尔特十字 | 10 | 深度详细分析 |
| 爱情金字塔 | 4 | 情感专项 |
| 马蹄铁 | 7 | 运势综合分析 |

## 正位与逆位

每张塔罗牌在占卜时有50%概率出现逆位：

- **正位**：图片朝上，牌义积极正面
- **逆位**：图片旋转180度，牌义复杂挑战

## AI 深度解读

- 每60秒只能发起一次请求
- 支持Markdown格式输出
- AI角色根据问题类型自动匹配

---

## 版本规范

**当前版本**: v3.0.0

语义化版本 (SemVer)：`主版本.次版本.修订号`

| 变更类型 | 更新示例 |
|----------|----------|
| 新功能 | v2.9 → v3.0 |
| 功能优化 | v3.0 → v3.1 |
| Bug修复 | v3.0 → v3.0.1 |

---

*详细规格说明参见 [SPEC.md](SPEC.md)*
