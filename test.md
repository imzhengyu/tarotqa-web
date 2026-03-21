# TarotQA 测试计划

## 1. 测试工具

项目使用 Vitest 作为测试框架。

### 1.1 安装的测试依赖

| 包名 | 说明 |
|------|------|
| vitest | 测试运行器 |
| @testing-library/react | React 组件测试 |
| @testing-library/jest-dom | Jest 断言扩展 |
| jsdom | DOM 环境模拟 |

### 1.2 测试命令

```bash
cd web

# 运行所有测试（监视模式）
npm run test

# 运行所有测试（单次）
npm run test:run

# 运行测试后预览
npm run preview
```

### 1.3 测试文件位置

- 测试文件：`src/tests/*.test.js`
- 配置文件：`vitest.config.js`
- 测试环境配置：`src/tests/setup.js`

## 2. 发布前测试检查清单

### 2.1 功能测试

- [ ] 首页加载正常，显示所有功能入口
- [ ] 占卜流程：选择牌阵 → 输入问题 → 洗牌 → 抽牌 → 查看结果
- [ ] AI 深度解读功能正常工作（60秒冷却验证）
- [ ] 牌库搜索和筛选功能正常
- [ ] 运势页面显示12星座数据
- [ ] 统计页面显示访问数据
- [ ] API 设置可以保存和清除 Key

### 2.2 移动端测试

- [ ] 移动端导航在页面顶部
- [ ] 所有页面在移动端可正常访问
- [ ] 卡牌在移动端显示正常
- [ ] 底部内容不被导航栏遮挡

### 2.3 响应式测试

- [ ] 桌面端 (≥1024px)：显示顶部导航和底部 footer
- [ ] 平板端 (768-1023px)：显示顶部导航
- [ ] 移动端 (<768px)：显示顶部导航，无 footer

### 2.4 浏览器兼容性

- [ ] Chrome 80+ 正常
- [ ] Firefox 75+ 正常
- [ ] Safari 13+ 正常
- [ ] Edge 80+ 正常

### 2.5 AI 解读调试信息测试

- [ ] 勾选"显示调试信息"可展开调试面板
- [ ] 调试面板显示 AI 原始回复
- [ ] 调试面板显示完整请求 JSON

### 2.6 安全测试

- [ ] XSS 防护：确保用户输入经过 DOMPurify 净化
- [ ] Markdown 渲染安全：AI 返回内容经过净化处理

## 3. 单元测试

### 3.1 API 服务测试 (`src/tests/api.test.js`)

**57 个测试用例**，覆盖：

| 测试组 | 测试内容 |
|--------|----------|
| getCards | 获取塔罗牌列表、牌数据字段验证 |
| getCard | 根据 ID 获取单张牌 |
| searchCards | 筛选（arcana/suit）、关键词搜索、多条件组合 |
| createDivination | 占卜记录创建 |
| getHoroscope | 星座运势获取 |
| getAllHoroscopes | 获取所有12星座运势 |
| personas | 角色定义完整性验证 |
| getRecommendedPersona | 关键词匹配、牌阵推荐、优先级逻辑 |
| buildTarotMessages | 消息构建、角色选择 |
| buildTarotPrompt | 提示词构建、牌信息展示 |
| getAIInterpretation | API Key 验证、格式校验、网络错误、HTTP 错误处理、响应解析 |
| API Key Priority | 用户 Key 优先级、空 Key 处理 |

### 3.2 Hooks 测试 (`src/tests/useVisitStats.test.js`)

**61 个测试用例**，覆盖：

| 测试组 | 测试内容 |
|--------|----------|
| generateUUID | UUID v4 格式验证、唯一性 |
| anonymizeIp | IP 脱敏、null/空字符串处理 |
| detectDeviceType | 桌面/平板/手机检测、边界值 |
| detectOSType | iOS/Android/Windows/macOS/Linux/Other 检测 |
| detectBrowser | Chrome/Firefox/Safari/Edge 检测 |
| calculateDeviceStats | 设备统计计算、空记录处理 |
| calculateOsStats | OS 统计计算、未知 OS 处理 |
| getSessionIP | 伪 IP 生成 |
| loadStats | localStorage 加载、错误处理 |
| saveStats | localStorage 保存 |
| createInitialStats | 初始数据结构验证 |
| Error Handling | JSON 解析错误、存储异常处理 |

## 4. 测试覆盖目标

### 4.1 当前覆盖

| 文件 | 语句覆盖 | 分支覆盖 | 函数覆盖 | 行覆盖 |
|------|----------|----------|----------|--------|
| services/api.js | 95% | 94% | 96% | 96% |
| hooks/useVisitStats.js | 46% | 58% | 44% | 42% |
| **总体** | **65%** | **76%** | **67%** | **63%** |

**测试统计**：
- 测试文件数：2
- 测试用例数：118
- 测试状态：全部通过 ✅

### 4.2 目标覆盖

- [x] API 服务函数（95%）
- [x] 数据处理函数
- [x] Hooks 基础功能（46%，工具函数已覆盖）
- [ ] React 组件渲染测试（待实现）
- [ ] 用户交互测试（待实现）
- [ ] 路由测试（待实现）

### 4.3 测试文件说明

| 文件 | 测试内容 |
|------|----------|
| `src/tests/api.test.js` | API 服务函数、角色匹配、构建消息、错误处理、网络请求模拟 |
| `src/tests/useVisitStats.test.js` | 工具函数（UUID、IP脱敏、设备检测、OS检测、浏览器检测）、统计计算、错误处理 |

---

*最后更新：2026-03-21*
*当前覆盖率：65%+（118 测试用例）*
