# Code Review - SPEC 与代码不一致清单

## 发现日期
2026-03-21

## 更新日期
2026-03-22 (新增测试覆盖 CR6-CR9, JSX-A11Y CR11)

---

## 修复状态汇总

| # | 问题 | 严重性 | 状态 |
|---|------|--------|------|
| 1 | 冷却 localStorage key | Low | ✅ 已修复 |
| 2 | TarotCard element 字段 | Low | ✅ 已修复 |
| 3 | 设备饼图颜色 | Medium | ✅ 已修复 |
| 4 | 移动端导航栏位置 | High | ✅ 已修复 |
| 5 | 移动端图片加载优化 | Medium | ✅ 已修复 |
| 6 | 移动端内容与导航条重叠 | High | ✅ 已修复 |
| 7 | 移动端固定导航栏 | High | ✅ 已修复 |
| 8 | 移动端 padding 优化 | Medium | ✅ 已修复 |
| 9 | 移动端缺少页面脚注 | Low | ✅ 已修复 |
| 10 | AI 运势预测缺少日期参数 | Medium | ✅ 已修复 |
| 11 | JSX-A11Y 无障碍警告 | Low | ✅ 已修复 |
| 12 | 移动端导航缺少运势tab | High | ✅ 已修复 |

---

## 1. 冷却速率限制 localStorage Key ✅ 已修复

| 项目 | 内容 |
|------|------|
| **SPEC 位置** | 3.6.6 速率限制 |
| **原问题** | SPEC 使用 `ai_last_request_time`，代码使用 `ai_cooldown_end` |
| **修复** | SPEC 已更新为 `ai_cooldown_end` |

---

## 2. TarotCard 数据模型 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **SPEC 位置** | 5.3 数据模型 |
| **原问题** | SPEC 声明 `element` 字段但代码不存在 |
| **修复** | SPEC 已更新，移除 `element`，添加 `reversedDescription` |

---

## 3. 访问统计 - 设备饼图颜色 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **SPEC 位置** | 3.7.3 统计数据展示 - 设备分布饼图 |
| **原问题** | 代码使用蓝/绿/黄色，SPEC 要求金色/暗红/深紫 |
| **修复** | `useVisitStats.js` 中 `getDeviceStatsWithPercentage` 已添加正确颜色 |
| **颜色配置** | 桌面: #D4AF37, 平板: #8B0000, 手机: #2D1B4E |

---

## 4. AI 角色关键词 (Info)

代码中关键词更丰富，是 SPEC 的超集，无需修改。

---

## 5. OS 饼图颜色

已一致，无需修改。

---

## 6. 测试覆盖率目标

目标 80%，实际 ~90% (173 测试用例)，已超出目标。

**最新覆盖率 (2026-03-22):**
- 语句覆盖率: 89.97%
- 分支覆盖率: 82.64%
- 函数覆盖率: 89.1%
- 行覆盖率: 89.69%

---

---

## 4. 移动端导航栏位置 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **SPEC 位置** | 3.5 移动端 UI - 顶部导航栏 |
| **原问题** | CSS 使用 `position: sticky`，移动端页面内容短时无法激活 sticky |
| **原因** | `sticky` 需要滚动上下文，内容不足以滚动时失效 |
| **修复方案** | 改用 `position: fixed` 确保始终在视口顶部 |
| **涉及文件** | `web/src/components/Layout.css` |
| **修复日期** | 2026-03-22 |

---

## 5. 移动端图片加载优化 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **原问题** | 仅使用原生 `loading="lazy"`，无 IntersectionObserver，无 blur-up |
| **优化方案** | 添加 IntersectionObserver 懒加载 + blur-up 占位效果 |
| **涉及文件** | `web/src/components/TarotCard.jsx`, `TarotCard.css`, `web/src/hooks/useIntersectionObserver.js` |
| **修复日期** | 2026-03-22 |

---

## 6. 移动端内容与导航条重叠 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **SPEC 位置** | 3.7.4 移动端状态栏 - 顶部导航栏 |
| **原问题** | 移动端中所有页面的主体内容会与导航条重叠，内容被导航条遮挡 |
| **要求** | 所有页面主体内容必须完全显示在导航条下方，不应有任何重叠 |
| **修复方案** | 使用 `padding-top: calc(max(65px, 10vh) + env(safe-area-inset-top, 0px))`，其中 `max(65px, 10vh)` 确保最小高度同时支持响应式比例 |
| **涉及文件** | `web/src/components/Layout.css` (line 154-155) |
| **修复日期** | 2026-03-22 |

---

## 7. 移动端导航栏位置 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **原问题** | 移动端导航栏使用 `position: sticky`，内容短时无法激活 sticky |
| **修复方案** | 改用 `position: fixed` 确保始终在视口顶部 |
| **涉及文件** | `web/src/components/Layout.css` |
| **修复日期** | 2026-03-22 |

---

## 8. 移动端 padding 计算方式优化 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **问题描述** | 使用 `max(65px, 10vh)` 在小屏设备上 padding 过大导致页面显示不完整 |
| **修复方案** | 改用 `clamp(86px, 12vh, 90px)` 限制范围，确保 padding 在 86px-90px 之间 |
| **计算公式** | `padding-top: calc(clamp(86px, 12vh, 90px) + env(safe-area-inset-top, 0px))` |
| **涉及文件** | `web/src/components/Layout.css` (line 154-155) |
| **修复日期** | 2026-03-22 |

---

## 9. 移动端缺少页面脚注 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **原问题** | 移动端没有页面脚注，与桌面版不一致 |
| **修复方案** | 移除 `global.css` 中隐藏移动端 footer 的规则，添加移动端 footer 样式 |
| **涉及文件** | `web/src/components/Layout.css` (line 159-165), `web/src/styles/global.css` (line 207-209) |
| **修复日期** | 2026-03-22 |

---

## 10. AI 运势预测缺少日期参数 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **原问题** | AI 运势预测未传递年月日参数，无法进行精确的运势分析 |
| **修复方案** | 使用 Day.js 获取当前日期，在调用 AI 运势分析时传递年月日参数 |
| **涉及文件** | `web/src/pages/Horoscope.jsx`, `web/src/services/api.js` |
| **技术实现** | 引入 dayjs 库，使用 `dayjs().year()`, `dayjs().month() + 1`, `dayjs().date()` 获取当前日期 |
| **修复日期** | 2026-03-22 |

---

## 11. JSX-A11Y 无障碍警告 (待修复)

| 项目 | 内容 |
|------|------|
| **问题描述** | ESLint 报告 20 个 jsx-a11y 警告，原因是 `<div>` 等非交互元素上使用了 `onClick` 但缺少键盘事件监听器 |
| **警告类型** | `jsx-a11y/click-events-have-key-events` 和 `jsx-a11y/no-static-element-interactions` |
| **严重性** | Low (warning) |
| **状态** | ⏳ 待修复 |

### 受影响文件和位置

| 文件 | 行号 | 元素 | 警告数量 |
|------|------|------|----------|
| `TarotCard.jsx` | 24 | `<div className="tarot-card" onClick={onClick}>` | 2 |
| `Cards.jsx` | 127 | `<div className="card-item" onClick>` | 2 |
| `Cards.jsx` | 145 | `<div className="card-modal" onClick>` | 2 |
| `Cards.jsx` | 146 | `<div className="card-modal-content" onClick>` | 2 |
| `Divination.jsx` | 287 | `<div className="spread-item" onClick>` | 2 |
| `Divination.jsx` | 347 | `<div ... onClick>` | 2 |
| `Profile.jsx` | 121, 125, 129, 133 | `<div className="menu-item" onClick>` | 8 |
| **合计** | | | **20** |

### 解决方案

#### 方案 A: 添加键盘事件监听器 (推荐)

在 `onClick` 基础上添加 `onKeyDown` 处理回车键和空格键：

```jsx
// 示例：TarotCard.jsx
<div
  className="tarot-card ..."
  onClick={onClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e);
    }
  }}
  role="button"
  tabIndex={0}
>
```

#### 方案 B: 替换为语义化按钮 (适合可交互元素)

将 `<div>` 替换为 `<button>`：

```jsx
// 示例：Profile.jsx
<button className="menu-item" onClick={() => setMessage('功能开发中')}>
  <span className="menu-icon">📋</span>
  <span>占卜历史</span>
</button>
```

#### 方案 C: 添加 ESLint 规则禁用注释 (快速但不推荐)

```jsx
// eslint-disable-next-line jsx-a11y/click-events-have-key-events
// eslint-disable-next-line jsx-a11y/no-static-element-interactions
<div className="tarot-card" onClick={onClick}>
```

### 推荐实施步骤

1. **Profile.jsx** (8 warnings) - 改用 `<button>` 元素，最适合语义化 ✅ 已修复
2. **Cards.jsx** (6 warnings) - 保持 `<div>` + 添加键盘事件，保留现有样式
3. **Divination.jsx** (2 warnings) - 保持 `<div>` + 添加键盘事件
4. **TarotCard.jsx** (2 warnings) - 添加 `role="button"` 和键盘事件

### 修复记录

| 文件 | 修复日期 | 状态 |
|------|----------|------|
| Profile.jsx | 2026-03-22 | ✅ 已修复 |
| Cards.jsx | 2026-03-22 | ✅ 已修复 |
| Divination.jsx | 2026-03-22 | ✅ 已修复 |
| TarotCard.jsx | 2026-03-22 | ✅ 已修复 |

---

## 12. 移动端导航缺少运势Tab ✅ 已修复

| 项目 | 内容 |
|------|------|
| **问题描述** | 移动端底部导航栏缺少"运势"入口，与桌面端不一致 |
| **桌面导航** | 首页、占卜、牌库、**运势**、统计、我的 (6个) |
| **移动导航** | 首页、占卜、牌库、统计、我的 (5个) ← 缺少运势 |
| **涉及文件** | `web/src/components/Layout.jsx` |
| **修复方案** | 在移动端导航中添加运势 tab，图标 ♈ |
| **修复日期** | 2026-03-22 |

## 13. 发布路径从子目录改为根路径 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **问题描述** | 当前 `base: '/tarotqa-web/'` 只能在 GitHub Pages 子路径下运行，需改为根路径 `/` 以支持任意域名部署 |
| **涉及文件** | `web/vite.config.js` |
| **修复方案** | 将 `base: '/tarotqa-web/'` 改为 `base: './'` |
| **状态** | ✅ 已修复 |

## 14. 微信域名验证文件未发布到根路径 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **问题描述** | `web/8d8032ee1f24e34837408fcbd0418f77.txt` 是微信域名验证文件，需要发布到网站根路径供微信验证使用 |
| **涉及文件** | `.github/workflows/deploy.yml` |
| **修复方案** | 在构建后步骤添加 `cp web/*.txt dist/` 复制到 dist 目录 |
| **状态** | ✅ 已修复 |

*CR 创建日期：2026-03-21*
*更新日期：2026-04-20*

---

## 16. SPEC.md Model 名称修正 ✅ 已修正

| 项目 | 内容 |
|------|------|
| **问题描述** | SPEC.md 中 model 名称为 `"MiniMax M2.7-highspeed"`（空格），与实际代码 `"MiniMax-M2.7-highspeed"`（连字符）不一致 |
| **修正方案** | SPEC.md 已更新为连字符格式 `MiniMax-M2.7-highspeed`，与代码保持一致 |
| **结论** | 代码始终正确，SPEC 描述有误 |

---

## 15. 硬编码参数分散多处 ✅ 已修复

| 项目 | 内容 |
|------|------|
| **问题描述** | 多处硬编码数值散落在不同文件中，难以统一维护和调整 |
| **涉及文件** | `api.js`, `useAIRequestCooldown.js`, `useVisitStats.js`, `useIntersectionObserver.js`, `TarotCard.jsx`, `Divination.jsx`, `Profile.jsx` |
| **修复方案** | 新建 `web/src/constants.js` 集中管理所有配置常量 |

### 常量分类

| 分类 | 常量 | 用途 |
|------|------|------|
| `AI_CONFIG` | `MODEL`, `API_URL`, `TEMPERATURE`, `TOP_P`, `MAX_COMPLETION_TOKENS` | AI API 调用参数 |
| `UI_LIMITS` | `MAX_QUESTION_LENGTH`, `QUESTION_WARNING_THRESHOLD`, `MAX_PHONE_LENGTH`, `MAX_VERIFICATION_CODE_LENGTH` | UI 输入限制 |
| `TIMING` | `AI_COOLDOWN_SECONDS`, `DEVICE_STATS_UPDATE_INTERVAL_MS`, `DURATION_HOUR_MS`, `DURATION_MINUTE_MS` | 时间和间隔配置 |
| `INTERSECTION` | `ROOT_MARGIN_PRELOAD`, `ROOT_MARGIN_DEFAULT` | 图片懒加载配置 |
| `BREAKPOINTS` | `TABLET: 768`, `DESKTOP: 1024` | 响应式断点 |

### 修复文件

| 文件 | 修改内容 |
|------|----------|
| `constants.js` | 新建 - 所有硬编码常量 |
| `api.js` | 引用 `AI_CONFIG` |
| `useAIRequestCooldown.js` | 引用 `TIMING.AI_COOLDOWN_SECONDS` |
| `useVisitStats.js` | 引用 `TIMING.DEVICE_STATS_UPDATE_INTERVAL_MS`, `BREAKPOINTS` |
| `useIntersectionObserver.js` | 引用 `INTERSECTION.ROOT_MARGIN_DEFAULT` |
| `useDevice.js` | 引用 `BREAKPOINTS` |
| `TarotCard.jsx` | 引用 `INTERSECTION.ROOT_MARGIN_PRELOAD` |
| `Divination.jsx` | 引用 `UI_LIMITS`, `TIMING` |
| `Profile.jsx` | 引用 `UI_LIMITS` |

| **状态** | ✅ 已修复 |
| **修复日期** | 2026-04-20 |

---

## 17. 卡牌动画效果增强 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **问题描述** | 卡牌选择和翻转页面缺少动画效果，用户体验不够流畅 |
| **涉及文件** | `TarotCard.jsx`, `TarotCard.css`, `Divination.jsx`, `Divination.css`, `Cards.jsx`, `Cards.css` |

### 动画效果

#### 占卜流程动画

| 动画 | 触发时机 | CSS属性 |
|------|----------|---------|
| 洗牌动画 | 点击"开始抽牌"时 | `@keyframes shuffle` - 0.8s ease-in-out |
| 卡牌飞行 | 点击卡牌抽取时 | `@keyframes dealCardFly` - 卡牌从中央放大消失 |
| 翻牌光晕 | 卡牌翻开时 | `@keyframes cardReveal` - 金色光晕效果 |

#### 牌库页面动画

| 动画 | 触发时机 | CSS属性 |
|------|----------|---------|
| 卡片入场 | 页面加载完成 | `@keyframes cardEntrance` - 交错淡入上浮 |
| 悬停增强 | 鼠标悬停 | scale(1.02) + 阴影 + 金色光边 |

### 移动端适配

- 复杂动画在移动端禁用（≤768px）
- 简化为 opacity/scale 过渡
- 支持 `prefers-reduced-motion` 媒体查询

---

## 18. AI 提示词优化 ✅ 已实现

| 项目 | 内容 |
|------|------|
| **问题描述** | AI 响应时间过长（24-31秒），影响用户体验 |
| **原因** | prompt 过长，包含大量冗余描述 |

### 优化内容

| 配置项 | 优化前 | 优化后 |
|--------|--------|--------|
| `MAX_QUESTION_LENGTH` | 1500 | 500 |
| `MAX_COMPLETION_TOKENS` | 2048 | 1024 |
| Persona 描述 | 200-400字符/个 | ~50字符/个 |
| 用户提示格式 | 每张牌多行详细描述 | 单行紧凑格式 |

### 优化效果

- 典型 prompt 大小：~1500字符 → ~300字符
- 预计响应时间：减少约 50%

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `constants.js` | `MAX_QUESTION_LENGTH` 500, `MAX_COMPLETION_TOKENS` 1024 |
| `personas.js` | 简化所有角色描述为 ~50 字符 |
| `api.js` | `buildTarotPrompt()` 改为紧凑格式 |
| `api.test.js` | 更新测试用例以匹配新格式 |

| **状态** | ✅ 已实现 |
| **实现日期** | 2026-04-21 |

## 19. 牌库页面加载性能优化 ✅ 已优化

| 项目 | 内容 |
|------|------|
| **问题描述** | 牌库页面加载时 78 张牌同时渲染和加载图片，导致首屏加载缓慢 |
| **原因** | 300px preload margin 导致大量图片同时启动加载 |
| **优化方案** | 1. 添加 `content-visibility: auto` 跳过屏幕外卡牌渲染 2. 缩小 ROOT_MARGIN_PRELOAD 从 300px 到 50px |
| **涉及文件** | `Cards.css`, `constants.js` |
| **预期效果** | 首屏渲染时间从 >150ms 降低到 <150ms |

### 优化细节

| 配置项 | 优化前 | 优化后 |
|--------|--------|--------|
| `ROOT_MARGIN_PRELOAD` | 300px | 50px |
| `ROOT_MARGIN_DEFAULT` | 200px | 100px |
| CSS `content-visibility` | 无 | auto |
| CSS `contain-intrinsic-size` | 无 | 0 220px |

| **状态** | ✅ 已优化 |
| **优化日期** | 2026-04-21 |
