import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { version } from './package.json';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// 构建时把「提交 sha + 提交时间」写进产物：CI 由 workflow 传入，本地直接问 git。
// 提交时间用 committer date（ISO8601），页面上再用 Asia/Shanghai 格式化成北京时间。
function fromGit(format) {
  try {
    return execFileSync('git', ['-C', REPO_ROOT, 'log', '-1', `--format=${format}`], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

const gitSha = process.env.VITE_GIT_SHA || fromGit('%H') || 'local';
const gitTime = process.env.VITE_GIT_TIME || fromGit('%cI') || '';

export default defineConfig(({ mode }) => {
  // 默认 Key 从环境变量注入：CI 用 GitHub secret，本地由 web/.env.local 提供
  // （vite.config 里的 process.env 不含 .env 文件，必须显式 loadEnv）
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const defaultApiKey = env.VITE_TAROT_DEEPSEEK_API_KEY || process.env.VITE_TAROT_DEEPSEEK_API_KEY || '';

  return {
    plugins: [react()],
    define: {
    __APP_VERSION__: JSON.stringify(version),
    __GIT_SHA__: JSON.stringify(gitSha),
    __GIT_TIME__: JSON.stringify(gitTime),
      'import.meta.env.VITE_DEFAULT_API_KEY': JSON.stringify(defaultApiKey)
    },
    server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
    // 部署基准：自定义域名（tarot.goodvibez.cn）在根目录 → '/'；
    // 若改用 github.io/tarotqa-web/ 这种子路径，构建时设 VITE_BASE=/tarotqa-web/ 即可。
    // 用绝对基准能同时解决"深层路由相对资源 404（白屏）"和"public 下字体路径"两个问题。
    base: process.env.VITE_BASE || '/',
    build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-iztro': ['react-iztro', 'iztro'],
          'vendor-astro': ['astronomy-engine'],
          'vendor-md': ['markdown-it', 'markdown-it-multimd-table', 'markdown-it-mark', 'dompurify'],
          'vendor-dayjs': ['dayjs']
        }
      }
    }
    }
  };
});
