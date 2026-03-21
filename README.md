# TarotQA - AI塔罗占卜平台

纯前端静态Web应用，提供塔罗牌占卜服务。无需安装，直接在浏览器中使用。

## 功能特性

- **78张完整塔罗牌**：大阿卡纳22张 + 小阿卡纳56张
- **5种牌阵**：单牌阵、三牌阵、凯尔特十字、爱情金字塔、马蹄铁
- **正位/逆位**：每张牌50%概率出现逆位，牌义解读不同
- **每日运势**：十二星座每日运势
- **本地图片**：78张塔罗牌图片存储于 `web/public/tarot-images/`，加载更快
- **3D动画**：卡牌翻转动画、悬浮效果
- **AI深度解读**：集成 MiniMax API，根据问题场景匹配合适的塔罗角色顾问，提供专业的深度解读
- **Markdown渲染**：AI解读内容支持完整标准Markdown语法（加粗、斜体、列表、表格、引用等）

## 技术栈

- React 18 + Vite 5
- React Router DOM 6
- CSS3 + CSS Variables
- 纯前端，无需后端

## 项目结构

```
tarotqa-web/
├── web/
│   ├── public/
│   │   └── tarot-images/     # 本地塔罗牌图片 (78张)
│   ├── src/
│   │   ├── components/      # 组件：TarotCard, Layout, ScrollIndicator
│   │   ├── pages/           # 页面：Home, Divination, Cards, Horoscope, Profile
│   │   ├── services/         # api.js (本地JSON数据加载 + AI API调用)
│   │   └── styles/           # global.css
│   └── index.html
├── resources/
│   ├── tarot-data.json       # 78张塔罗牌完整数据
│   └── tarot-personas.md      # AI角色设定
├── SPEC.md                   # 项目规格说明书
└── README.md
```

## 快速开始

### 安装依赖

```bash
cd web
npm install
```

### 开发预览

```bash
cd web
npm run dev
```

### 构建生产版本

```bash
cd web
npm run build
```

构建产物在 `web/dist/` 目录，可直接部署到任意静态服务器。

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

### 配置 API Key

1. 访问 [MiniMax Platform](https://platform.minimaxi.com) 注册并获取 API Key
2. 在"我的"页面配置您的 API Key
3. API Key 会安全存储在浏览器本地

### AI 角色系统

根据您的问题类型，系统会自动选择合适的塔罗角色顾问：

| 角色 | 适用场景 | 关键词 |
|------|----------|--------|
| 综合顾问 | 通用问题 | 默认 |
| 职涯发展顾问 | 事业抉择、工作问题 | 工作、事业、跳槽、面试 |
| 爱情情感顾问 | 感情占卜、恋爱问题 | 爱情、感情、复合、桃花 |
| 财富财务顾问 | 财运占卜、投资理财 | 金钱、财富、投资、理财 |
| 决策指引顾问 | 重大决策、选择困难 | 选择、决定、纠结 |
| 综合运势顾问 | 综合运势分析 | 运势、运气、趋势 |

### Markdown 支持

AI 解读内容支持完整的标准 Markdown 语法：

- **加粗**：`**text**`
- *斜体*：`*text*`
- ***加粗+斜体***：`***text***`
- 引用块：`> text`
- 列表：`- item` 或 `1. item`
- 表格：`| col1 | col2 |`
- 标题：`## 标题`
- 链接：`[text](url)`
- 代码：`` `code` ``

### 调试模式

在占卜结果页面可以开启"显示调试信息"，查看：

- 请求时间戳
- 牌阵类型
- 使用的 AI 角色
- 卡牌数量
- 用户问题
- 完整请求数据（JSON）
- 抽卡详情（JSON）

## 图片资源

塔罗牌图片来源于 fatemaster.ai，已下载至本地 `web/public/tarot-images/` 目录。

## 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## License

MIT

---

*文档版本：v2.4*
*最后更新：2026-03-20 22:30*
