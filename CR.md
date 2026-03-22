# Code Review - SPEC 与代码不一致清单

## 发现日期
2026-03-21

## 更新日期
2026-03-22 (新增测试覆盖 CR6-CR9)

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

*CR 创建日期：2026-03-21*
*更新日期：2026-03-22*
