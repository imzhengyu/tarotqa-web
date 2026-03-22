# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

TarotQA 是一个纯前端静态 Web 应用，提供塔罗牌占卜服务。无需后端，直接部署到 GitHub Pages。

## 技术栈

- React 18 + Vite 5
- React Router DOM v6
- markdown-it + DOMPurify (Markdown 渲染)
- dayjs (日期处理)
- Vitest (测试)
- CSS3 + CSS Variables

## 项目结构

```
tarotqa-web/
├── web/
│   ├── src/
│   │   ├── components/     # TarotCard, Layout, PieChart, ErrorBoundary, OsPieChart, ScrollIndicator
│   │   ├── pages/          # Home, Divination, Cards, Horoscope, Statistics, Profile
│   │   ├── hooks/          # useDevice, useIntersectionObserver, useVisitStats
│   │   ├── services/       # api.js (本地JSON数据 + AI API调用)
│   │   ├── data/          # spreads.js, personas.js
│   │   ├── styles/         # global.css
│   │   └── tests/         # Vitest 测试 (api.test.js, components.test.jsx, useVisitStats.test.js, useIntersectionObserver.test.jsx)
│   └── public/tarot-images/ # 78张塔罗牌本地图片
├── resources/
│   ├── tarot-data.json     # 塔罗牌完整数据 (78张)
│   └── tarot-personas.md   # AI角色设定
├── dist/                   # 构建产物 (GitHub Pages)
├── SPEC.md                 # 详细规格说明书
└── CR.md                   # 代码审查问题追踪
```

## 常用命令

```bash
cd web

npm run dev          # 开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run preview      # 预览构建结果
npm run test         # 测试 (监视模式)
npm run test:run     # 测试 (单次运行)
npm run test:regression  # 回归测试 + 覆盖率报告
npm run lint         # ESLint 检查
npm run lint:fix     # ESLint 自动修复
npm run lint:css     # Stylelint 检查
npm run lint:css:fix # Stylelint 自动修复
```

## Code Style

- 函数组件 + Hooks
- API 调用必须 try-catch
- CSS: 组件级 CSS 文件 + global.css

## Lint 要求 (Deploy Rule)

- ESLint: `npm run lint` 必须 0 errors, 0 warnings
- CSS Lint: `npm run lint:css` 必须 0 errors, 0 warnings
- 提交前必须确保两个 lint 都通过

## 数据流

1. **塔罗牌数据**: `resources/tarot-data.json` → `api.js` → 组件
2. **AI 解读**: 前端 → MiniMax API (需配置 API Key)
3. **访问统计**: localStorage 存储，`useVisitStats.js` 管理
4. **运势数据**: `api.js` 内置 12 星座运势 JSON

## 关键文件

- `api.js` - 所有数据加载和 API 调用入口
- `TarotCard.jsx` - 塔罗牌组件，支持正位/逆位、懒加载、blur-up 效果
- `Layout.jsx` - 布局组件，处理桌面/移动端响应式导航
- `Horoscope.jsx` - 每日运势页面，3x4 星座网格，AI 运势分析
- `spreads.js` - 牌阵定义 (单牌、三牌、凯尔特十字、爱情金字塔、马蹄铁)
- `personas.js` - AI 角色定义 (综合顾问、职涯顾问、爱情顾问等)
- `useVisitStats.js` - 访问统计管理，localStorage 持久化
- `useIntersectionObserver.js` - 图片懒加载观察器
