# TarotQA Web 问题清单

来源：2026-09-16 全仓库代码审查（`python scripts/audit_assets.py`、`scripts/probe_astrology.py`、
`python scripts/run_checks.py` 的实测结果）。按「先修正确性，再修门禁，最后清理」的顺序推进。

图例：`待修` 未处理 · `进行中` 正在改 · `已修` 代码已改且有测试 · `待确认` 需要产品决策

## P0 正确性

| # | 问题 | 证据 | 状态 |
|---|------|------|------|
| 1 | 西方星盘时间换算重复计入时区偏移，结果还依赖运行机器的时区 | `web/src/utils/astrology/calculations.js` `createAstroTime`；实测上海案例太阳黄经偏 +0.318°（≈8h），把机器时区改成 UTC 后同一天数据从 84.2289 变 84.5870 | 已修 |
| 2 | 上升点/中天公式错误：`longitude` 是硬编码 120，且把 day-of-month 当成"自 J2000 起的天数" | `calculations.js` `calculateAscendantMC`（`const longitude = 120` 在文件末尾）；实测上升点 0:00→205.24°、18:00→205.98°（18 小时只转 0.74°，应约 270°） | 已修 |
| 3 | 宫位实际是等宫制却标注为 Placidus | `calculations.js` `calculateHouses` 的 JSDoc | 已修 |
| 4 | 行星计算失败时静默返回 0°，把错误数据当结果 | `calculations.js` `calculatePlanets` catch 分支 | 已修 |
| 5 | 紫微斗数把 23:00 归为亥时（iztro 的 12 号才是晚子时） | `web/src/utils/ziwei/ziweiData.js` `Math.floor(birthTime / 2) % 12` | 已修 |

## P1 功能与数据

| # | 问题 | 证据 | 状态 |
|---|------|------|------|
| 6 | 手机号验证码登录是假流程：mock 后端 + `demo-token`，登录后界面永远停在未登录态 | `web/src/pages/Profile.jsx`、`web/src/services/api.js` `sendCode/verifyCode/getMe` | 已修（移除假登录与 mock，Profile 只保留 API Key 管理 + 统计入口） |
| 7 | 「今日/本周提问数」用 `firstVisit` 判断时间窗，跨天访问会漏算 | `web/src/hooks/useVisitStats.js` | 已修 |
| 8 | 设备判定有两套实现（布局用 UA，统计用 `window.innerWidth`） | `web/src/hooks/useDevice.js` vs `useVisitStats.js` `detectDeviceType` | 已修（统一走 useDevice 的 UA 判定，pad→tablet） |
| 9 | `resources/tarot-data.json` 指向 `.jpg`，实际资源是 `.webp`，两份数据不一致 | `python scripts/audit_assets.py` | 已修（`--sync-data` 以 public 为准同步；audit 继续守护） |
| 10 | mimi 风格卡面只完成 3/78，生成脚本硬编码绝对路径 | `web/public/tarot-mimi-images/`、`scripts/generate_mimi_tarot.py` | 待办（内容生产任务，未动） |
| 11 | 首页宣称"12星座每日运势"但无页面/路由；`api.js` 里是硬编码假运势 | `web/src/pages/Home.jsx`、`api.js` `getHoroscopesData` | 已修（文案改为真实卖点，假运势数据删除） |
| 12 | 冷却 5 秒（注释写"调试模式"）与 README 宣称的 60 秒不一致 | `web/src/constants.js` | 已修（默认 60s，可用 `VITE_AI_COOLDOWN_SECONDS` 覆盖） |

## P2 质量门禁

| # | 问题 | 证据 | 状态 |
|---|------|------|------|
| 13 | 函数覆盖率恰好卡在阈值；临时文件混入会直接压红 | `python scripts/run_checks.py --coverage` | 部分修复（探针改到 `web/scripts/` 不再污染；余量仍需补测试） |
| 14 | `coverage-check.js` 内部重复跑一遍完整测试，且不受 worker 上限约束 | `web/scripts/coverage-check.js` | 已修（新增 `--no-run`，CI 复用已有报告；运行分支也带上 worker 上限） |
| 15 | CI 不跑覆盖率门禁，也不跑密钥扫描；仓库没有安装 git hook | `.github/workflows/deploy.yml`、无 `.husky` | 已修（CI 增加密钥扫描 / sanity / 覆盖率门禁 / 日志 artifact）；git hook 仍未安装（可选） |
| 16 | CI 里 `rm -rf pnpm-lock.yaml` 后重装，生产构建依赖版本不可复现 | `.github/workflows/deploy.yml` | 已修（改为 `pnpm install --frozen-lockfile`） |
| 17 | `check-api-key-leaks.js` 不扫描 `vite.config.js`/`.env`，也识别不出 `eyJ` 形式的 JWT | `web/scripts/check-api-key-leaks.js` | 已修（新增配置文件与 `.env*` 扫描、JWT/eyJ 规则） |

## P3 安全与隐私

| # | 问题 | 证据 | 状态 |
|---|------|------|------|
| 18 | `VITE_DEFAULT_API_KEY` 被打进前端产物，部署站点上任何人可提取共享 Key | `web/vite.config.js` `define` | 待确认（行为保留，README 已明确提示；是否改成用户自带 Key 由你决定） |
| 19 | 用户 API Key 明文存 localStorage | `Profile.jsx`、`api.js` `_getApiKey` | 待确认（纯前端无法真正加密，已在 UI/README 说明仅存本地） |
| 20 | README 宣称"不存储到任何本地存储"，实际存了统计、API Key、token、冷却；统计里的 `anonymizedIp` 是 UA 哈希出的伪 IP | `README.md`、`useVisitStats.js` `getSessionIP` | 已修（README 改为准确描述；伪 IP 改名 `deviceFingerprint` 并去掉伪造 IP 格式） |

## P4 代码与仓库卫生

| # | 问题 | 证据 | 状态 |
|---|------|------|------|
| 21 | i18n 残留：`TarotCard` 的"图片加载失败"、`Layout` 手写三元、`Divination` 用 `alert()` | 相关文件 | 已修 |
| 22 | 无 404 兜底路由 | `web/src/App.jsx` | 已修（新增 NotFound 页与路由 + 测试） |
| 23 | 死代码：`api.js` 的 horoscope / orders / auth mock、`UI_LIMITS` 手机号常量 | `web/src/services/api.js`、`constants.js` | 已修 |
| 24 | 垃圾文件 `web/8d8032ee1f24e34837408fcbd0418f77.txt` 已入库 | `git ls-files` | 已修（已删除） |
| 25 | 根 `requirements.txt` 名为 Python 依赖、实为过期 npm 清单 | `requirements.txt` | 已修（改为依赖说明 + 指向 package.json） |
| 26 | 根 `package.json` 脚本仍引用不存在的 `server/`、`miniprogram/` | 根 `package.json` | 已修（改为 web/sanity/check/audit；移除未用的 concurrently，lockfile 已同步） |
| 27 | `web/package.json` 版本 `2.9` 不是合法 SemVer（`2.9.0`） | `web/package.json` | 已修 |
| 28 | 旧重构计划 `plan.md` 的阶段 2/4/5 未完成 | `plan.md` | 待确认（阶段 3 星盘计算已在本轮修复） |
| 29 | `web/src/pages/Profile.css` 里遗留的登录/用户信息样式已无引用 | `web/src/pages/Profile.css` | 待办（无功能影响） |

## P5 UI / 配色（2026-09-16 新增）

| # | 问题 | 证据 | 状态 |
|---|------|------|------|
| 30 | 深紫主题次要文字在渐变紫色端仅 2.85:1、成功色 3.15:1、金色边框 1.88:1 | `python scripts/audit_ui_colors.py` | 待修（方案见 `design/ui-review.md`） |
| 31 | 主题未令牌化：84 种硬编码颜色（金 ~100 处、深紫面板 ~60 处） | `logs/ui-*/colors.md` | 待修 |
| 32 | 语义色与品牌色同源（成功=紫、错误=粉），含义无法区分 | `web/src/styles/global.css` | 待修 |
| 33 | `base: './'` + BrowserRouter：深层路由相对资源 404 → 白屏 | `web/vite.config.js` | **已修**：base 改为绝对基准（`process.env.VITE_BASE \|\| '/'`），自定义域名根路径与子路径部署都能用；本地验证用 `scripts/serve_dist.py` |
| 34 | 深层路由下 favicon 404（`/ziwei/favicon.svg`） | 同上 | 待修（小） |

## P6 版权与许可（2026-09-16 审计）

审计命令：`python scripts/audit_licenses.py`（报告 `logs/licenses-*/licenses.md`）

| # | 风险 | 证据 | 等级 | 处理建议 |
|---|------|------|------|----------|
| 35 | **78 张塔罗牌图来自 fatemaster.ai**，且已入库并公开部署 | `web/public/tarot-data.json` 的 `source`/`imageSource` 字段；`git ls-files web/public/tarot-images` 78 个文件 | 高 | 换成公有领域牌组（RWS 1909 扫描件，PD-old）或自绘/AI 原创图；现图直接商用/公开发布有侵权风险 |
| 36 | `web/public/tarot-mimi-images/*` 是上述图片的 image-to-image 衍生品 | `scripts/generate_mimi_tarot.py`（以 `tarot-images/*.webp` 为输入） | 中 | 衍生作品同样受限；建议改为纯文生图重做 |
| 37 | 牌义/描述文案来源不明（同为 fatemaster 数据） | `web/public/tarot-data.json` 的 `description`/`reversedDescription` | 中 | 用自己的话重写或 AI 生成后人工校对 |
| 38 | 本地字体（Noto Sans SC 子集）未随包附带 OFL 许可证 | `web/public/fonts/*.woff2` 无 LICENSE 文件 | 低（合规瑕疵） | 补 `web/public/fonts/OFL.txt` 与 THIRD-PARTY 清单 |
| 39 | 依赖里的 copyleft/未知许可 | `dompurify`(MPL OR Apache)、`axe-core`(MPL, dev)、`jszip`(MIT OR GPL)、`png-js`(未声明) | 低 | 都能走 MIT/Apache 分支；`png-js` 属间接依赖，建议确认或替换 |

## 已完成

| # | 事项 | 说明 |
|---|------|------|
| A | 统一检查脚本 | `python scripts/run_checks.py`（lint / csslint / 单测 / 覆盖率 / 构建，带 worker 与内存上限） |
| B | 资源与数据一致性检查 | `python scripts/audit_assets.py` |
| C | 星盘计算运行时探针 | `python scripts/probe_astrology.py`（跨机器时区对拍 + 参考值比对） |
| D | Claude Code → Codex 迁移 | `AGENTS.md`、`.codex/`、`.agents/skills/deploy`、`deprecated/claude-code/` |
| E | 检查日志与后处理 | 每次运行落 `logs/<脚本>-<时间戳>/`，终端只打摘要；`summary.md` / `summary.json` 可复盘 |
| F | 测试有效性审计 | `python scripts/audit_tests.py`（无断言 / 弱断言 / 只断言 mock / 重名） |

## 测试有效性（2026-09-16 本轮）

审计结果（`python scripts/audit_tests.py`）：用例 526 → 492，无断言 1 → 0，弱断言 19 → 1，
只断言 mock 3 → 1，重名 21 → 13。主要动作：

- `DecorativeElements.test.jsx`：20 条（每个组件"渲染 svg"+"自定义 size"）→ 10 条密集断言
- `useBackToTop.test.jsx`：3 条只断言类型 → 2 条真实滚动阈值行为（含自定义阈值）
- `PoofNavLink.test.jsx`：2 条（1 条无断言）→ 1 条断言真实路由跳转结果
- `calculations.test.js`：合并重复/弱断言，改为 `it.each` 风格密集断言（时区等价、星座与黄经一致、宫位合法性、相位 orb/exact）
- `Profile.test.jsx`：删除 8 条假登录用例，改为 7 条 API Key/入口真实性用例

待办：`web/src/tests/api-ziwei-astrology.test.js` 仍有 13 处重名（ziwei 与 astrology 两个入口复制了同一套
`_callAI` 错误分支用例），可合并为按入口 `it.each` 的参数化用例。

## 测试运行策略

- 日常改动只跑 `python scripts/run_sanity.py`（lint + 关键用例，约 25-30s）
- **全量单测与覆盖率只在 git commit 前运行**，且必须先向用户告警并取得明确批准
- 放行命令：`python scripts/run_checks.py --commit`（不带 `--commit` 时脚本会拒绝执行全量/覆盖率）
