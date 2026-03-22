# CLAUDE.md

本文件为 Claude Code 提供开发指导。

## 开发命令

```bash
cd web
npm run dev          # 开发服务器 (localhost:3000)
npm run build        # 生产构建
npm run preview      # 预览构建
npm run test         # 测试（监视模式）
npm run test:run     # 测试（单次）
npm run lint         # ESLint 检查（必须 0 errors, 0 warnings）
npm run lint:fix     # ESLint 自动修复
npm run lint:css     # Stylelint 检查
npm run lint:css:fix # Stylelint 自动修复
```

## 代码规范

- 函数组件 + Hooks
- API 调用必须 try-catch
- CSS: 组件级 CSS 文件 + global.css
- 提交前必须 lint 全部通过

## 架构要点

- **数据**: `resources/tarot-data.json` → `api.js` → 组件
- **AI**: 前端 → MiniMax API（默认 Key 开箱即用）
- **统计**: localStorage 存储，`useVisitStats.js` 管理
- **运势**: `api.js` 内置 12 星座运势

## 关键文件

| 文件 | 用途 |
|------|------|
| `api.js` | 数据加载和 AI API 入口 |
| `TarotCard.jsx` | 卡牌组件（正位/逆位、懒加载） |
| `Layout.jsx` | 响应式布局（桌面/移动端） |
| `Horoscope.jsx` | 每日运势（3x4 星座网格 + AI 分析） |
| `spreads.js` | 牌阵定义 |
| `personas.js` | AI 角色定义 |
| `useAIRequestCooldown.js` | AI 请求冷却逻辑（Divination/Horoscope 共用） |

## Deploy Rule

- ESLint: 0 errors, 0 warnings
- CSSLint: 0 errors, 0 warnings
- 测试必须全部通过
