# 测试与回归策略

## 概述

本项目采用多层测试策略：单元测试覆盖工具函数与 hooks，组件测试覆盖 React 组件渲染与交互，页面集成测试覆盖 API 调用与业务流。所有测试在本地运行，覆盖率阈值由开发者本地把控，确保提交前质量达标。

## 可用脚本

| 脚本 | 命令 | 使用时机 |
|------|------|----------|
| test | `pnpm run test` | 开发时持续运行测试（监视模式） |
| test:run | `pnpm run test:run` | 快速一次性执行全部测试 |
| test:ci | `pnpm run test:ci` | CI/静默场景，使用 dot reporter |
| test:coverage | `pnpm run test:coverage` | 生成覆盖率报告 |
| test:regression | `pnpm run test:regression` | 手动触发回归测试，结果追加至 `regression_report.md` |
| coverage:check | `pnpm run coverage:check` | 检查覆盖率是否满足阈值 |
| lint | `pnpm run lint` | 检查 JS/JSX 代码规范 |
| lint:fix | `pnpm run lint:fix` | 自动修复 ESLint 可修复的问题 |
| lint:css | `pnpm run lint:css` | 检查 CSS 代码规范 |
| lint:css:fix | `pnpm run lint:css:fix` | 自动修复 Stylelint 可修复的问题 |
| validate | `pnpm run validate` | 本地全量验证：lint + css lint + 覆盖率 + build |
| pre-commit | `pnpm run pre-commit` | 本地提交前检查：lint + css lint + 测试 + 覆盖率 |

## 预提交工作流

提交代码前，直接执行：

```bash
pnpm run pre-commit
```

该命令会依次检查：

1. `node scripts/check-api-key-leaks.js` — 扫描硬编码 API Key / Token，发现则直接退出
2. `pnpm run lint` — JS/JSX 0 errors、0 warnings
3. `pnpm run lint:css` — CSS 0 errors、0 warnings
4. `pnpm run test:run` — 全部测试通过
5. `pnpm run coverage:check` — 覆盖率满足阈值

> 注：这里仅提供 npm script，未强制安装 Husky；如需自动触发，可在后续迭代中加入 `simple-git-hooks` 或 `husky`。

## API Key 泄露检查

`scripts/check-api-key-leaks.js` 会在 pre-commit 第一步执行，扫描 `src/` 与 `scripts/` 中的潜在硬编码密钥：

- OpenAI 风格 `sk-...` 密钥
- 赋值给 `apiKey` / `api_key` / `token` / `secret` / `minimax_api_key` 等变量的长字符串
- 硬编码 `VITE_DEFAULT_API_KEY`
- `Bearer` 硬编码 token
- 其他可疑长字母数字串

已知测试占位符（如 `test-key`、`default-key`、`mock`、`placeholder`）会被跳过。若检测到疑似泄露，提交会被阻断。如需扩展白名单或规则，编辑 `scripts/check-api-key-leaks.js`。

## CI 行为

CI 流水线执行以下任务：

- `pnpm run lint` — 代码规范检查
- `pnpm run lint:css` — CSS 规范检查
- `pnpm run test:ci` — 全部测试（dot reporter，不检查覆盖率阈值）
- `pnpm run build` — 生产构建验证

覆盖率检查由本地 `pre-commit` 负责，避免 CI 因覆盖率轻微波动阻塞部署。

## 回归报告

运行 `pnpm run test:regression` 时，`scripts/regression-reporter.js` 会：

- 执行带覆盖率的全量测试（`pnpm vitest run --coverage --reporter=json`）
- 解析 JSON reporter 输出，读取测试通过/失败数量与覆盖率数据
- 若失败，自动重试最多 2 次，过滤偶发的异步抖动
- 将结果（含时间戳、Git 分支与 commit SHA、通过/失败状态、覆盖率）追加到 `regression_report.md`

`regression_report.md` 与临时 JSON 输出已加入 `.gitignore`，不会进入版本控制，仅用于本地追踪回归历史。

## 扩展脚本

如需调整回归报告格式或解析逻辑，修改 `scripts/regression-reporter.js`：

- `parseJsonResults()` — 调整 JSON 结果解析
- `formatReport()` — 调整报告输出格式
- `runTests()` — 修改测试执行命令（如调整 reporter 参数）

如需调整覆盖率阈值或对比逻辑，修改 `scripts/coverage-check.js` 或 `vitest.config.js`。

## 不稳定测试处理

优先修复不稳定测试的根因（异步时序、DOM 依赖、外部状态泄漏等）。`scripts/regression-reporter.js` 本身不提供重试逻辑，若测试偶发失败，应回到代码层面排查，而非依赖重试掩盖问题。
