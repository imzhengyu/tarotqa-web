# TarotQA 发布指南

## 1. 发布流程

**禁止直接 commit 到 main/master 分支**。

### 1.1 发布步骤

1. **本地开发**：完成功能开发和自测
2. **运行测试**：`npm run test:run` 确保所有测试通过
3. **本地构建**：`npm run build` 构建成功
4. **本地预览测试**：`npm run preview` 人工确认功能正常
5. **提交代码**：通知维护者进行 code review
6. **合并发布**：维护者合并后触发 GitHub Actions 自动部署

### 1.2 版本号规范

发布前必须确保以下文件版本号统一为 `x.x.x` 格式：

| 文件 | 版本位置 | 说明 |
|------|----------|------|
| `web/package.json` | `version` 字段 | 主版本文件 |
| `SPEC.md` | 文档版本号 | 与 package.json 保持一致 |
| `README.md` | 文档版本号 | 与 package.json 保持一致 |

### 1.3 版本号规则

- **主版本 (Major)**：不兼容的重大功能变更 → 例：v2.9.0 → v3.0.0
- **次版本 (Minor)**：向后兼容的新功能添加 → 例：v2.9.0 → v2.10.0
- **修订号 (Patch)**：向后兼容的问题修复和小优化 → 例：v2.9.0 → v2.9.1

### 1.4 发布检查清单

- [ ] `web/package.json` 版本已更新
- [ ] `SPEC.md` 版本号已更新
- [ ] `README.md` 版本号已更新
- [ ] `resources/tarot-personas.md` 版本号已更新（如有变更）
- [ ] 所有版本号一致
- [ ] 所有测试通过 (`npm run test:run`)
- [ ] 构建成功 (`npm run build`)
- [ ] 本地预览功能正常 (`npm run preview`)

## 2. GitHub Actions 部署

部署由 `.github/workflows/deploy.yml` 配置，push 到 master 分支自动触发。

### 2.1 构建环境变量

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `VITE_DEFAULT_API_KEY` | 默认 MiniMax API Key | GitHub Secrets |
| `VITE_GIT_SHA` | Git commit SHA | GitHub Actions 自动注入 |

### 2.2 部署地址

- 生产环境：https://imzhengyu.github.io/tarotqa-web/
- GitHub Pages 仓库：imzhengyu/tarotqa-web

## 3. 本地命令

```bash
cd web

# 安装依赖
npm install

# 开发预览
npm run dev

# 运行测试
npm run test

# 运行测试（单次）
npm run test:run

# 构建生产版本
npm run build

# 本地预览（自动运行测试后启动）
npm run preview
```

## 4. 版本更新记录

每次发布需要更新以下文件的版本号：

1. `web/package.json` - version 字段
2. `SPEC.md` - 文档版本号和 Change Log
3. `README.md` - 文档版本号

---

*最后更新：2026-03-21*
