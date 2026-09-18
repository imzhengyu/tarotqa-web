# AGENTS.md

本文件为 Codex 提供 TarotQA Web 的开发指导（由原 Claude Code 的 `CLAUDE.md` 迁移而来）。

默认用中文输出所有回复。

## 开发命令

所有命令均在 `web/` 目录下执行：

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

## 本地环境约束（老机器，必须遵守）

## Token 成本约束（必须遵守）

当前模型按 token 计费（deepseek-flash），**每一轮回复都要为此付费**，因此：

1. **先跑脚本，再读结果**：任何检查/统计/截图都用 `scripts/` 里的现成脚本，脚本把完整输出写进 `logs/`，
   agent 只读摘要或 `summary.md`，不要把大段输出读进上下文。
2. **不重复读文件**：已读过的文件、已生成的报告不要重读；需要复用就引用路径（`logs/<run>/summary.md`）。
3. **不为看输出而重跑命令**：重跑既烧算力也烧 token，优先读已有日志。
4. **一轮尽量做完**：把多个小改动合并成一次脚本运行 / 一次工具调用，减少往返。
5. **回复保持精简**：默认只给「结论 + 证据（路径/数值）+ 下一步」，不复述代码、不写长篇解释；
   文档只在确实需要沉淀时写，且写进仓库文件而不是回复里。
6. **视觉产物只给可粘贴 URL**（见下），不要贴大段 HTML/CSS。

本机配置较低，任何命令、脚本、子任务都要控制资源占用：

- **线程/进程数不超过 4**：测试 worker 最多 3 个，同时运行的子代理总数（含主 agent）≤ 4。
  默认串行执行，能顺序跑就不要并行；不要同时跑「构建 + 测试 + 覆盖率」。
- **内存不超过 12GB**：Node 进程用 `NODE_OPTIONS=--max-old-space-size=4096` 兜住堆上限；
  发现 OOM 或机器卡顿时，先降 worker 数再考虑别的优化。
- **尽量用空间换时间**：允许用磁盘缓存/预生成产物（`node_modules`、构建产物、coverage 报告、
  图片转码与 mimi 卡面等）来避免重复计算；同一份数据重复读时先缓存，不要反复重算。
- 跑检查统一用 `python scripts/run_checks.py`（脚本已内置上述限制），不要绕过它手敲 npx 命令。

## 运行命令的方式

不要在终端里临时拼一长串命令；需要反复执行或要汇总结果的检查一律写进脚本再调用：

| 任务 | 命令 |
|------|------|
| 全套检查（lint + csslint + 单测 + 覆盖率 + 构建） | `python scripts/run_checks.py` |
| 只跑其中几项 | `python scripts/run_checks.py --lint --tests` / `--coverage` / `--build` |
| 只跑部分测试文件 | `python scripts/run_checks.py --tests -- src/tests/pages/Divination.test.jsx` |
| 数据/图片/资源一致性检查 | `python scripts/audit_assets.py` |
| UI 配色与对比度审计（WCAG） | `python scripts/audit_ui_colors.py --palettes design/palettes.json` |
| 生成主题示例网页 | `python scripts/build_theme_preview.py` → `design/theme-preview.html` |
| 主题示例截图（**用本机 Edge**，不用 Chromium） | `python scripts/snapshot_theme_preview.py` → `design/preview-shots/` |
| 本地人工视觉验收（构建 + 起服务 + 打印 URL） | `python scripts/run_local_server.py [--open] [--no-build]` |
| 双击即可的本地部署（Windows） | `deploy-local.bat`（内部调用 `scripts/deploy-local.ps1`，端口固定 4000） |
| 真实页面截图（Edge + Pages 同款回落） | `python scripts/snapshot_app_pages.py [--skip-build]` → `design/preview-shots/app/` |
| **移动端视觉回归（每个页面）** | `python scripts/run_visual_tests.py` → `design/preview-shots/mobile/`；已并入全量门禁 |
| **端到端交互回归（Playwright + Edge）** | `python scripts/run_e2e_tests.py`；已并入全量门禁（AI 走 route mock，不花钱） |
| 受控推送（网络检查 + 放行标记 + push） | `python scripts/push_approved.py [--approve] [--dry-run]` |
| 网络/VPN/代理检查 | `python scripts/check_network.py [--detect-proxy\|--apply-proxy]` |
| AI 解读导出 Word 的排版抽样 | `python scripts/probe_docx_export.py` → `design/preview-docs/ai-analysis-sample.docx` |

两个脚本都在 `web/` 下执行 pnpm/npx，并打印 PASS/FAIL 汇总；新增检查项请扩展脚本而不是在对话里手敲命令。

UI/配色改动另见 `design/ui-review.md`：改动配色后必须跑一次对比度审计，确认 0 FAIL 再截图留档。

**视觉产物的汇报格式**：凡是交付预览页 / 截图 / 示例网页，最终总结必须给出
**完整可粘贴的 `file:///` URL**（绝对路径，如
`file:///D:/git_workspace/tarotqa-web/design/style-preview.html?style=restrained`），
让用户能直接贴进 Edge 打开；不要只给相对路径或文件名。

**输出必须落盘，不要往终端灌大段输出**：

- 每次运行都会新建 `logs/<脚本名>-<时间戳>/`，每个检查的**完整** stdout/stderr 写进对应的 `.log`；
- 跑完（无论成败）脚本会对日志做**后处理**：解析用例/文件级 PASS/FAIL、失败用例名与断言原因、lint 问题行，
  在终端打印结构化摘要，并写出 `summary.md` / `summary.json`；
- 需要中间结果、堆栈、覆盖率明细时去读日志文件（`logs/latest.txt` 指向最近一次运行目录，例如
  `logs/latest.txt` → `logs/sanity-20260916-220501/`，单测细节在 `关键用例.log`）；
- 不要为了看输出而重跑命令，也不要直接 dump 到终端；解析逻辑统一放在 `scripts/checklog.py`，
  新脚本复用 `run_and_log` / `print_report` / `write_summary`。

## 质量门禁

改动收尾（提交/发布）前必须满足：

- ESLint: 0 errors, 0 warnings
- Stylelint: 0 errors, 0 warnings
- 测试必须全部通过

### 测试运行策略（重要）

1. **默认只跑 sanity**：`python scripts/run_sanity.py`（lint + 关键用例，约 30s）。
2. **不要随意跑全量测试与覆盖率**：`全量单测` 与 `覆盖率` 只在准备 git commit 时跑
   （它们要 1-2 分钟，老机器上更慢）。
3. **启动全量/覆盖率前必须向用户告警并取得明确 approve**，得到批准后才能执行；
   脚本层面用 `python scripts/run_checks.py --commit` 放行，不带 `--commit` 时脚本会直接拒绝执行全量/覆盖率。
4. 测试用例要**有效**：优先用 `it.each` + 明确的 inline 断言，减少用例数量而不是减少断言；
   不要写只断言 `toBeDefined()` / `typeof x === 'number'` / `>= 0` 这类几乎必然通过的用例。
   静态审计：`python scripts/audit_tests.py`。

### 提交与推送（硬性规则）

- `python scripts/install_git_hooks.py` 安装的 hooks 会在 `git commit` 时自动跑全量门禁
  （`scripts/run_checks.py --commit`：lint + csslint + 单测 + 覆盖率 + 构建），门禁不过则提交被阻止。
- **push 前必须先检查 VPN/网络**：`pre-push` hook 会先跑 `python scripts/check_network.py`，
  用它验证 `git ls-remote origin` 是否可达（GitHub 在部分网络下必须开 VPN）。
  网络不通时不要反复重试 push，先确认 VPN/代理再推。
- **Codex 不得执行 `git push`**：推送只能由用户在命令行主动发起。
  需要推送时，Codex 必须先明确报告「将推送哪些提交、目标分支、会触发 Pages 发布」并取得用户确认；
  确认后写入放行标记 `git rev-parse HEAD > .git/CODEX_PUSH_APPROVED`，再由用户执行 `git push`。
  `pre-push` hook 会校验该标记；没有标记（或标记 sha 与 HEAD 不一致）一律拒绝推送。
- **所有 git 操作都走脚本**：推送用 `python scripts/push_approved.py [--approve] [--dry-run]`，
  代理检测/配置用 `python scripts/check_network.py --detect-proxy|--apply-proxy`。
  禁止在终端里拼接多条命令（`;` `&&` `|`）完成多步操作——写进脚本再调用。

完整发布流程见 `.agents/skills/deploy/SKILL.md`。

## 协作规范

- 复杂工程任务必须采用 Agentic Model + Harness Engineering：将任务拆分为可独立验证的子任务，使用 subagent 并行或串行执行，主 agent 负责任务编排与最终验收。
- 结论要有证据：以 lint / test / build 的实际输出为准，不要仅凭阅读代码下判断。

## 架构要点

- **数据**: `resources/tarot-data.json` → `api.js` → 组件
- **AI**: 前端 → DeepSeek API（默认 Key 由环境变量注入，见「默认 API Key」一节）
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

## Codex 运行配置

- 项目配置：`.codex/config.toml`（审批策略、沙箱、MCP 服务器）。
- 命令白名单：`.codex/rules/default.rules`（由原 Claude Code `permissions.allow` 转换）。
- 仓库级技能：`.agents/skills/`（`deploy` 技能对应原 `/deploy` 命令）。
- 沙箱默认 `workspace-write`：仓库内可直接读写，仓库外访问与联网需要审批。
- MiniMax MCP（开发工具用，与站点 AI 无关）的密钥通过本机环境变量 `MINIMAX_API_KEY` 透传，不要写进仓库。

### 默认 API Key（DeepSeek）

- 代码只读 `import.meta.env.VITE_DEFAULT_API_KEY`（由 `vite.config.js` 从环境变量注入）
- 本地：`web/.env.local` 的 `VITE_TAROT_DEEPSEEK_API_KEY`，**.env\* 已被 .gitignore 忽略**
- CI：GitHub secret `DEEPSEEK_API_KEY` → 构建时注入同名的 `VITE_TAROT_DEEPSEEK_API_KEY`
- 严禁把 Key 写进源码、测试、文档或提交历史；发现泄露立即轮换 Key
- 原 Claude Code 配置已备份到 `deprecated/claude-code/`，仅作留档，不再被任何工具加载。
