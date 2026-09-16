/**
 * API Key Leak Detector
 * Scans source files for potentially hardcoded API keys / tokens.
 * Exits with code 1 if any suspicious pattern is found.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const WEB_ROOT = resolve(__dirname, '..');

const SCAN_DIRS = ['src', 'scripts'];
// 目录之外还要显式检查的配置文件：以前这里漏掉了 vite.config.js，
// 而 VITE_DEFAULT_API_KEY 正是从 vite.config.js 的 define 注入构建产物的。
const SCAN_FILES = ['vite.config.js', 'vitest.config.js', 'index.html'];
const ROOT_ENV_FILES = ['.env', '.env.local', '.env.production', '.env.development'];
const ALLOWED_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs']);
const IGNORED_DIRS = new Set(['node_modules', 'dist', 'coverage', 'tests', '__tests__']);

// Patterns considered potential API key / token leaks.
const PATTERNS = [
  // OpenAI-style secret key
  { name: 'OpenAI-style secret key', regex: /['"`]sk-[a-zA-Z0-9]{20,}['"`]/g },
  // Generic high-entropy key when assigned to api/key/token/secret variables
  { name: 'Hardcoded API key assignment', regex: /(?:api[_-]?key|apikey|secret|token|deepseek_api_key|authorization)\s*[:=]\s*['"`][a-zA-Z0-9_\-]{32,}['"`]/gi },
  // Hardcoded VITE_DEFAULT_API_KEY value
  { name: 'Hardcoded VITE_DEFAULT_API_KEY', regex: /VITE_DEFAULT_API_KEY\s*=\s*['"`][^'"`]{10,}['"`]/g },
  // Bearer token with literal value
  { name: 'Hardcoded Bearer token', regex: /['"`]Bearer\s+[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+['"`]/g },
  // DeepSeek-like long alphanumeric key (heuristic)
  { name: 'Suspicious long alphanumeric secret', regex: /['"`][a-zA-Z0-9]{40,}['"`]/g },
  // JWT 形式的 key（DeepSeek 的 key 是 eyJ 开头的 JWT，旧规则完全覆盖不到）
  {
    name: 'Hardcoded JWT-style key',
    regex: /['"`]eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}['"`]/g
  },
  {
    name: 'Suspicious eyJ-prefixed secret',
    regex: /['"`]eyJ[a-zA-Z0-9_-]{40,}['"`]/g
  }
];

// Known safe test mocks / placeholders that should not be flagged.
const SAFE_PLACEHOLDERS = [
  'test-key',
  'test_key',
  'default-key',
  'default_key',
  'example',
  'placeholder',
  'your-api-key',
  'your_api_key',
  'mock',
  'fake',
  'dummy',
  'undefined',
  'process.env',
  'import.meta.env'
];

function isPlaceholder(value) {
  const lower = value.toLowerCase();
  return SAFE_PLACEHOLDERS.some(p => lower.includes(p));
}

function getFiles(dir, files = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      getFiles(fullPath, files);
    } else if (entry.isFile() && ALLOWED_EXTS.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const leaks = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { name, regex } of PATTERNS) {
      const matches = line.matchAll(regex);
      for (const match of matches) {
        const value = match[0];
        if (isPlaceholder(value)) continue;
        leaks.push({
          file: filePath.replace(WEB_ROOT + '/', ''),
          line: i + 1,
          type: name,
          snippet: line.trim().slice(0, 120)
        });
      }
    }
  }

  return leaks;
}

function main() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const fullDir = resolve(WEB_ROOT, dir);
    try {
      getFiles(fullDir, files);
    } catch {
      // directory may not exist
    }
  }
  for (const name of SCAN_FILES) {
    const fullPath = resolve(WEB_ROOT, name);
    if (existsSync(fullPath)) files.push(fullPath);
  }
  for (const name of ROOT_ENV_FILES) {
    const fullPath = resolve(WEB_ROOT, '..', name);
    if (existsSync(fullPath)) files.push(fullPath);
  }

  const allLeaks = [];
  for (const file of files) {
    const leaks = scanFile(file);
    allLeaks.push(...leaks);
  }

  if (allLeaks.length === 0) {
    console.log('No potential API key leaks detected.');
    process.exit(0);
  }

  console.error('\nPotential API key/token leaks detected:');
  console.error('=====================================\n');
  for (const leak of allLeaks) {
    console.error(`[${leak.type}]`);
    console.error(`  File: ${leak.file}:${leak.line}`);
    console.error(`  Snippet: ${leak.snippet}\n`);
  }
  console.error('Commit blocked. Please remove hardcoded secrets and use environment variables or localStorage instead.');
  process.exit(1);
}

main();
