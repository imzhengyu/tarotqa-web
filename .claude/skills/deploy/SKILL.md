# Deploy Skill

Complete release workflow for TarotQA web application.

## Usage

```
/deploy
```

## Pre-flight Check

Before deploying, verify:
- All tests pass: `npm run test:run`
- Lint clean: `npm run lint` (0 errors, 0 warnings)
- CSSLint clean: `npm run lint:css` (0 errors, 0 warnings)
- Build succeeds: `npm run build`

## Release Steps

### 1. Version Update

Update version in these files (all must match `x.x.x`):

| 文件 | 位置 |
|------|------|
| `web/package.json` | `version` 字段 |
| `SPEC.md` | `## 8. 版本规范` |
| `README.md` | `## 版本规范` |
| `test.md` | `## 版本规范` |

**Version rules (SemVer)**:
- Major: Breaking changes → v2.9 → v3.0
- Minor: New features → v2.9 → v2.10
- Patch: Bug fixes → v2.9 → v2.9.1

### 2. Build & Preview

```bash
cd web
npm run build     # Production build
npm run preview   # Preview at http://localhost:4173
```

### 3. Commit & Push

```bash
git add .
git commit -m "release: v{x.x.x}"
git push
```

## GitHub Actions

Push to `master` triggers auto-deploy to:
- **URL**: https://imzhengyu.github.io/tarotqa-web/

**Environment variables** (from GitHub Secrets):
- `VITE_DEFAULT_API_KEY` - Default MiniMax API Key
- `VITE_GIT_SHA` - Auto-injected by Actions

## Requirements

- Node.js 18+
- All dependencies installed (`npm install`)
- No direct commits to master (PR required)
