# 测试计划

## 测试命令

```bash
cd web
npm run test         # 测试（监视模式）
npm run test:run     # 测试（单次）
npm run test:regression  # 回归测试 + 覆盖率报告
npm run lint         # ESLint 检查
npm run lint:css     # Stylelint 检查
```

## 测试文件

| 文件 | 测试内容 |
|------|----------|
| `src/tests/api.test.js` | API 服务函数、角色匹配、错误处理 |
| `src/tests/useVisitStats.test.js` | 工具函数、统计计算、localStorage |
| `src/tests/components.test.jsx` | TarotCard、PieChart、ErrorBoundary、Layout |

## 覆盖率状态

| 文件 | 语句 | 分支 | 函数 | 行 |
|------|------|------|------|-----|
| services/api.js | 93.7% | 86.2% | 100% | 93.5% |
| components/* | 85.1% | 76.0% | 81.8% | 85.5% |
| hooks/* | 86.3% | 77.3% | 88.1% | 85.4% |
| **总体** | **88.9%** | **80.5%** | **89.3%** | **88.5%** |

> 注：Horoscope.jsx 因 JSDOM 环境限制无法准确追踪 React Hooks 覆盖率，已排除。

## 发布前检查清单

### 页面功能

- [ ] 首页：Banner轮播、功能入口、导航正常
- [ ] 占卜页：5种牌阵选择、抽牌流程、正位/逆位显示
- [ ] 牌库页：搜索、筛选、卡牌详情弹窗
- [ ] 运势页：12星座数据、AI分析按钮
- [ ] 统计页：访问数据饼图
- [ ] 我的页：API Key设置

### 响应式

- [ ] 桌面端 (≥1024px)：顶部导航 + 底部 footer
- [ ] 移动端 (<768px)：顶部固定导航，内容不被遮挡
- [ ] 移动端与桌面端页面数量一致（6个页面：首页、占卜、牌库、运势、统计、我的）

### 安全

- [ ] XSS防护：用户输入经过 DOMPurify 净化
- [ ] AI内容：Markdown 渲染安全

---

## 版本规范

**当前版本**: v3.0.0

语义化版本 (SemVer)：`主版本.次版本.修订号`

---

*最后更新：2026-03-22*
