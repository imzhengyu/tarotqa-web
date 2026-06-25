默认用中文输出所有回复。

# TarotQA Web 开发指南

本文件为 Claude Code 提供开发指导。

## 开发命令

```bash
cd web
pnpm install         # 安装依赖（必须使用 pnpm）
pnpm run dev         # 开发服务器 (localhost:3000)
pnpm run build       # 生产构建
pnpm run preview     # 预览构建
pnpm run test        # 测试（监视模式）
pnpm run test:run    # 测试（单次）
pnpm run lint        # ESLint 检查（必须 0 errors, 0 warnings）
pnpm run lint:fix    # ESLint 自动修复
pnpm run lint:css    # Stylelint 检查
pnpm run lint:css:fix # Stylelint 自动修复
```

## 包管理规则

**必须使用 pnpm 安装所有 npm 依赖**
- 使用 `pnpm add <package>` 安装新包
- 使用 `pnpm remove <package>` 卸载包
- 不要使用 npm install 或 yarn

## 代码规范

- 函数组件 + Hooks
- API 调用必须 try-catch
- CSS: 组件级 CSS 文件 + global.css
- 提交前必须 lint 全部通过

## 协作规范

- 复杂工程任务必须采用 Agentic Model + Harness Engineering：将任务拆分为可独立验证的子任务，使用 subagent 并行或串行执行，主 agent 负责任务编排与最终验收。

## 架构要点

- **数据**: `resources/tarot-data.json` → `api.js` → 组件
- **AI**: 前端 → MiniMax API（默认 Key 开箱即用）
- **统计**: localStorage 存储，`useVisitStats.js` 管理
- **塔罗占卜**: `spreads.js` 牌阵定义，`personas.js` AI 角色
- **紫微斗数**: `iztro` + `react-iztro` 排盘和渲染
- **西方星盘**: `astronomy-engine` 天文计算 + 自定义 SVG 渲染
- **i18n**: `LanguageContext` 提供 `t(zh, en)` 翻译 helper
- **导出**: `utils/export.js` 提供 `exportToPNG` PNG 导出

## 关键文件

| 文件 | 用途 |
|------|------|
| `api.js` | 数据加载和 AI API 入口 |
| `TarotCard.jsx` | 卡牌组件（正位/逆位、懒加载） |
| `Layout.jsx` | 响应式布局（桌面/移动端） |
| `Divination.jsx` | 塔罗占卜主页面 |
| `BirthInfoForm.jsx` | 出生信息输入组件（紫微/星盘共用） |
| `DisclaimerModal.jsx` | 免责声明弹窗（tarot/ziwei/astrology） |
| `ZiweiChart.jsx` | 紫微斗数排盘页面（react-iztro） |
| `AstrologyChart.jsx` | 西方星盘页面（astronomy-engine + SVG） |
| `spreads.js` | 牌阵定义 |
| `personas.js` | AI 角色定义 |
| `useAIRequestCooldown.js` | AI 请求冷却逻辑 |
| `useBackToTop.js` | 回到顶部浮动按钮逻辑 |
| `utils/astrology/calculations.js` | 西方星盘天文计算 |
| `utils/ziwei/ziweiData.js` | 紫微斗数数据生成 |
| `utils/export.js` | PNG 导出功能（html2canvas） |
| `context/LanguageContext.jsx` | 语言上下文，含 `t()` 翻译 helper |

## 新功能说明

### 紫微斗数
- 使用 `iztro` 库进行排盘计算
- 使用 `react-iztro` 的 `Iztrolabe` 组件渲染命盘
- AI 解读调用 `api.getAIZiweiInterpretation()`
- 首次使用需阅读免责声明

### 西方星盘
- 使用 `astronomy-engine` 库计算行星位置
- 自定义 SVG 渲染星盘图表
- AI 解读调用 `api.getAIAstrologyInterpretation()`
- 支持点击行星查看详细信息

### 通用功能
- **导出 PNG**: AI 分析结果可导出为 PNG 图片（html2canvas）
- **回到顶部**: 所有页面支持滚动后浮动按钮快速返回顶部
- **Markdown 表格**: AI 返回的表格内容使用 `markdown-it-multimd-table` 正确渲染
- **中英切换**: 所有页面文案支持中英文，`t(zh, en)` helper 简化翻译

## Deploy Rule

- ESLint: 0 errors, 0 warnings
- CSSLint: 0 errors, 0 warnings
- 测试必须全部通过
