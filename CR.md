# Code Review - SPEC 与代码不一致清单

## 发现日期
2026-03-21

## 更新日期
2026-03-22

---

## 修复状态汇总

| # | 问题 | 严重性 | 状态 |
|---|------|--------|------|
| 1 | 冷却 localStorage key | Low | ✅ 已修复 |
| 2 | TarotCard element 字段 | Low | ✅ 已修复 |
| 3 | 设备饼图颜色 | Medium | ✅ 已修复 |
| 4 | 移动端导航栏位置 | High | ✅ 已修复 |
| 5 | 移动端图片加载优化 | Medium | ✅ 已修复 |

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

目标 80%，实际 90%+ (152 测试用例)，已超出目标。

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

*CR 创建日期：2026-03-21*
*更新日期：2026-03-22*
