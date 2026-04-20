# TarotQA - AI塔罗占卜平台 规格说明书

## 1. 项目概述

**项目名称**: AI塔罗占卜平台 (TarotQA)
**类型**: 纯前端静态Web应用
**定位**: 提供塔罗牌占卜服务，无需安装，直接在浏览器中使用
**在线体验**: https://imzhengyu.github.io/tarotqa-web/

### 1.1 核心价值

- 真实塔罗牌图片 + 专业牌义解读
- 丰富的交互动画效果
- 极低门槛，即开即用
- 单页面应用，无需服务器

### 1.2 支持平台

- **Web浏览器**: Windows/macOS/Linux，Chrome/Firefox/Safari/Edge
- **移动端浏览器**: iOS/Android，Safari Mobile/Chrome Mobile
- **响应式设计**: 自动适配桌面/平板/手机三种屏幕尺寸

---

## 2. 功能清单

### 2.1 塔罗牌内容 (78张)

| 类别 | 数量 | ID范围 |
|------|------|--------|
| 大阿卡纳 (Major Arcana) | 22张 | 0-21 |
| 小阿卡纳 (Minor Arcana) | 56张 | 22-77 (权杖/圣杯/宝剑/金币) |

**数据文件**: `resources/tarot-data.json`

### 2.2 牌阵功能

| 牌阵名称 | 牌数 | 说明 |
|----------|------|------|
| 单牌阵 | 1 | 快速简单占卜 |
| 三牌阵 | 3 | 过去/现在/未来 |
| 凯尔特十字牌阵 | 10 | 深度详细分析 |
| 爱情金字塔 | 4 | 情感专项 |
| 马蹄铁牌阵 | 7 | 运势综合分析 |

### 2.3 占卜流程

```
用户输入问题 → 选择牌阵 → 洗牌 → 抽牌 → 翻牌 → 牌义展示 → AI深度解读
```

1. **问题输入**: 用户描述咨询问题（最多1500字）
2. **牌阵选择**: 从5种牌阵中选择
3. **洗牌动画**: 卡牌洗牌动画效果
4. **抽牌**: 点击卡牌抽取
5. **翻牌动画**: 卡牌翻转展示正/背面
6. **牌义展示**: 显示抽中牌的含义
7. **AI深度解读**: 获取AI专业分析

### 2.4 正位与逆位

每张塔罗牌有**正位**和**逆位**两种状态：

| 状态 | 出现概率 | 含义特点 |
|------|----------|----------|
| 正位 | 50% | 牌面朝上，含义积极正面 |
| 逆位 | 50% | 牌面旋转180度，含义复杂挑战 |

- 正位：图片朝上，文字正常显示
- 逆位：图片旋转180度，文字保持正常方向
- 每张牌包含 `description` 和 `reversedDescription`

### 2.5 每日星座运势

- 覆盖十二星座
- 本地运势数据
- 包含：综合运势、爱情运势、事业运势、财运
- 支持AI运势分析（使用Day.js传递日期参数）

### 2.6 AI深度解读

- **角色系统**: 根据问题类型自动匹配（综合/职涯/爱情/财富/决策/运势）
- **Markdown支持**: 输出支持加粗、斜体、列表、表格、引用等
- **速率限制**: 每60秒一次请求
- **默认API Key**: 通过GitHub Secrets配置，开箱即用
- **用户API Key**: 存储于localStorage，优先级高于默认Key
- **耗时计时**: 显示 ⏱️ 图标，格式 `HH:MM:SS`，从请求开始计时至结果返回

---

## 3. 技术规格

### 3.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | React 18 + Vite 5 |
| 路由 | React Router DOM 6 |
| 样式 | CSS3 + CSS Variables |
| Markdown | markdown-it + DOMPurify |
| 日期处理 | dayjs |
| 测试 | Vitest |
| AI API | MiniMax ChatCompletion API |

### 3.2 项目结构

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
│   ├── tarot-data.json       # 78张塔罗牌数据
│   └── tarot-personas.md     # AI角色设定
├── dist/                     # 构建产物
└── SPEC.md
```

### 3.3 数据模型

**塔罗牌 (TarotCard)**
```javascript
{
  id: Number,                  // 0-77
  name: String,                 // 牌名称
  nameEn: String,              // 英文名
  arcana: String,              // 'major' | 'minor'
  suit: String,                // 'wands'|'cups'|'swords'|'pentacles'|null
  number: Number,              // 1-10 或 null
  imageUrl: String,            // 远程图片URL (备用)
  localPath: String,           // 本地图片路径 (优先使用)
  description: String,          // 正位描述
  reversedDescription: String,  // 逆位描述
  keywords: [String]           // 关键词标签
}
```

**访问记录 (VisitRecord)**
```javascript
{
  sessionId: String,            // 会话ID (UUID)
  anonymizedIp: String,         // 脱敏IP
  questionCount: Number,        // 提问次数
  firstVisit: String,           // 首次访问时间 (ISO 8601)
  lastVisit: String,           // 最后访问时间
  deviceType: String,          // 'desktop' | 'tablet' | 'mobile'
  osType: String,              // 操作系统类型
  browser: String              // 浏览器类型
}
```

---

## 4. UI/UX 设计规范

### 4.1 视觉风格

**复古塔罗牌原版风格**

- 主色调：深紫 `#2D1B4E`、金色 `#D4AF37`、暗红 `#8B0000`
- 背景：深色渐变，神秘感
- 卡片边框：金色镶边
- 字体：衬线体（Cinzel用于标题）

### 4.2 色彩规范

```
Primary:      #2D1B4E (深紫)
Secondary:    #D4AF37 (金色)
Accent:       #8B0000 (暗红)
Background:   #1A0F2E (深蓝黑)
Text Primary: #F5F5F5 (浅白)
Text Secondary: #B8A9C9 (淡紫)
Success:      #4CAF50 (绿)
Warning:      #FF9800 (橙)
Error:        #F44336 (红)
```

### 4.3 动画效果

| 动效 | 说明 |
|------|------|
| 洗牌动画 | 卡牌随机交错移动 |
| 翻牌动画 | 3D翻转效果 |
| 悬浮效果 | 卡牌轻微上浮 + 发光 |

### 4.4 页面结构

```
├── 首页 (/)
├── 占卜页 (/divination)
├── 牌库页 (/cards)
├── 运势页 (/horoscope)
├── 统计页 (/statistics)
└── 我的页 (/profile)
```

### 4.5 响应式断点

| 设备类型 | 屏幕宽度 | 布局 |
|----------|----------|------|
| 桌面 (Desktop) | ≥1024px | 多列网格，完整导航 |
| 平板 (Tablet) | 768px-1023px | 中等密度，两列网格 |
| 手机 (Mobile) | <768px | 单列堆叠，顶部固定导航 |

### 4.6 移动端适配

- 按钮最小点击区域: 44x44px
- 卡牌最小点击区域: 80x120px
- 移动端固定顶部导航栏 (position: fixed)
- 页面内容顶部padding避免被导航栏遮挡

---

## 5. 安全规范

### 5.1 XSS防护

所有用户输入和API返回的HTML/Markdown内容必须经过DOMPurify净化处理。

**需要净化的场景**:
- AI解读内容 (MiniMax API返回)
- 用户问题输入
- 占卜结果数据

### 5.2 隐私保护

访问统计遵循隐私优先原则：
- 不记录具体提问内容
- IP地址脱敏处理
- 会话ID使用UUID，不关联真实身份
- 支持一键清除所有数据

---

## 6. AI API 规范

### 6.1 API端点

**端点**: `POST https://api.minimaxi.com/v1/text/chatcompletion_v2`

**请求格式**:
```json
{
  "model": "MiniMax-M2.7-highspeed",
  "messages": [
    { "role": "system", "content": "<系统提示词>" },
    { "role": "user", "content": "<用户问题+抽卡信息>" }
  ],
  "temperature": 1,
  "top_p": 0.95,
  "max_completion_tokens": 2048
}
```

### 6.2 错误处理

| 错误类型 | 错误信息 |
|----------|----------|
| API Key未配置 | 请先在设置中配置MiniMax API Key |
| HTTP 401 | API Key无效或已过期 |
| HTTP 403 | API Key权限不足 |
| HTTP 429 | 请求过于频繁，请稍后重试 |
| HTTP 500+ | MiniMax服务器繁忙 |

---

## 7. 浏览器支持

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## 8. 版本规范

**当前版本**: v3.0.0

语义化版本 (SemVer)：`主版本.次版本.修订号`

| 变更类型 | 更新示例 |
|----------|----------|
| 新功能 | v2.9 → v3.0 |
| 功能优化 | v3.0 → v3.1 |
| Bug修复 | v3.0 → v3.0.1 |

---

*文档版本：v3.0.0*
*最后更新：2026-03-22*
