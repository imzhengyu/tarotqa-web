/**
 * AI 解读导出 PDF：pdfmake + 本地化的 Noto Sans SC 子集字体。
 *
 * 之所以自带字体：PDF 必须内嵌字体才能保证中文在任何设备上显示一致；
 * 字体文件放在 web/public/fonts/（每个约 2.4MB，浏览器会缓存），只有点导出时才加载。
 *
 * 移动端注意事项（真机踩过的坑）：
 *   1. pdfmake 0.3 的 download() 是 async 且**不接回调**；旧写法 `download(name, resolve)`
 *      会让包出来的 Promise 永远不 settle —— 失败也没人报错，用户只看到"点了没反应"；
 *   2. 真正触发保存的是「锚点点击」。这一步若发生在若干次 await 之后就不再属于用户手势，
 *      iOS Safari（以及部分 App 内置浏览器）会静默忽略。
 *      所以流程拆成两步：先生成 Blob，再由用户**当场点**「保存 / 分享」按钮（手势内），
 *      能用系统分享面板就走 navigator.share({files})，否则退回锚点下载 + 手工保存链接。
 */
import { buildPdfDefinition } from './pdfMarkdown';

// 用构建基准拼字体地址：base '/' → /fonts/...；base '/tarotqa-web/' → /tarotqa-web/fonts/...
const SAME_ORIGIN_BASE = `${(import.meta.env && import.meta.env.BASE_URL) || '/'}fonts/`;
// 国内加速源（可选，逗号分隔，优先于同源）：例如阿里云 OSS / 腾讯云 COS 的默认域名，
// 构建时用 VITE_FONT_BASE_URLS 注入；没配就只用同源。
const MIRROR_BASES = String((import.meta.env && import.meta.env.VITE_FONT_BASE_URLS) || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => (item.endsWith('/') ? item : `${item}/`));
export const FONT_BASES = [...MIRROR_BASES, SAME_ORIGIN_BASE];

// **必须用未压缩的 TTF**：pdfmake 内置的 fontkit 对 WOFF2（glyf 变换）解码不完整，
// 字形轮廓会变空 —— PDF 能下载、能抽到文本（ToUnicode 在），但页面渲染出来是白页。
// 所以这里的字体是 fontTools 预处理好的 TTF 子集（见 scripts/build_pdf_fonts.py）。
// 体积比 woff2 大（core 约 1.1MB），换来的是"内容真的画得出来"。
//
// 两级字体：核心子集（GB2312 一级字表，1.1MB，覆盖常用字 99%+）优先；
// 文本里出现核心子集没有的字（生僻字/二级字）时才回退到全量子集（1.7MB）。
const FONT_SETS = {
  core: {
    normal: 'noto-sans-sc-core-400.ttf',
    bold: 'noto-sans-sc-core-700.ttf'
  },
  full: {
    normal: 'noto-sans-sc-full-400.ttf',
    bold: 'noto-sans-sc-full-700.ttf'
  }
};
const CORE_INDEX_FILE = 'noto-sans-sc-core-ranges.json';
const FONT_ALIAS = 'NotoSC';

// 持久缓存：字体一旦下载成功就存进 Cache Storage，同一台设备之后不再重复下 2MB
const FONT_CACHE = 'tarotqa-pdf-fonts-v1';

// 站点部署在 GitHub Pages，国内访问可能极慢甚至长时间无响应：
// 没有超时的话字体请求会一直挂着，UI 就永远停在"正在生成 PDF…"。
export const PDF_FONT_TIMEOUT_MS = 30000;
export const PDF_BUILD_TIMEOUT_MS = 60000;
// 慢网（3G/省流量模式）把预算放宽，否则"能用只是慢"也会被判失败
export const PDF_FONT_TIMEOUT_SLOW_MS = 90000;
// 非最后一个源（镜像）只给短预算：挂了就赶紧换下一个，别把时间耗光
export const PDF_MIRROR_TIMEOUT_MS = 10000;

// 字体与 pdfmake 都不小：按「字体层级」缓存住，同一会话内第二次导出不再走网络
const fontsCache = new Map();
let pdfMakePromise = null;
let coreIndexPromise = null;

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
  }
  return window.btoa(binary);
}

function withTimeout(promise, timeoutMs, message) {
  if (!timeoutMs || typeof setTimeout !== 'function') return promise;
  let timer;
  const timeout = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** 默认字体下载预算：按网络类型自适应（慢网给 60s）。 */
export function defaultFontTimeoutMs(connection = typeof navigator === 'undefined' ? null : navigator.connection) {
  if (connection?.saveData) return PDF_FONT_TIMEOUT_SLOW_MS;
  const type = connection?.effectiveType || '';
  if (/(^|-)(slow-)?2g$|(^|-)3g$/.test(type)) return PDF_FONT_TIMEOUT_SLOW_MS;
  return PDF_FONT_TIMEOUT_MS;
}

/**
 * 按 FONT_BASES 顺序取一个文件：镜像源给短预算（挂了立刻换源），
 * 最后一个源（同源）给完整预算。命中 Cache Storage 时不走网络。
 */
async function fetchResource(
  fileName,
  { fetchImpl = fetch, timeoutMs = defaultFontTimeoutMs(), bases = FONT_BASES } = {}
) {
  let lastError = null;
  for (const [index, base] of bases.entries()) {
    const url = `${base}${fileName}`;
    const cached = await readFromCache(url);
    if (cached) return cached;
    const budget = index === bases.length - 1 ? timeoutMs : Math.min(timeoutMs, PDF_MIRROR_TIMEOUT_MS);
    try {
      const buffer = await fetchWithTimeout(url, { fetchImpl, timeoutMs: budget });
      await writeToCache(url, buffer);
      return buffer;
    } catch (error) {
      lastError = error;
    }
  }
  const aborted = lastError?.name === 'AbortError' || lastError?.timeout;
  const timeoutError = new Error(
    `资源下载${aborted ? '超时' : '失败'}：${fileName}`
    + `（${Math.round(timeoutMs / 1000)}s，已尝试 ${bases.length} 个源，请检查网络后重试）`
    + (lastError?.message ? `｜原因：${lastError.message}` : '')
  );
  timeoutError.timeout = Boolean(aborted);
  throw timeoutError;
}

async function fetchFontBase64(fileName, options) {
  return toBase64(await fetchResource(fileName, options));
}

async function fetchWithTimeout(url, { fetchImpl, timeoutMs }) {
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const abortTimer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetchImpl(url, controller ? { signal: controller.signal } : undefined);
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return await response.arrayBuffer();
  } finally {
    if (abortTimer) clearTimeout(abortTimer);
  }
}

function fontCache() {
  // Response 缺失的环境（老内核/测试环境）直接不缓存，功能不受影响
  return typeof caches === 'undefined' || typeof Response === 'undefined' ? null : caches;
}

async function readFromCache(url) {
  const storage = fontCache();
  if (!storage) return null;
  try {
    const cache = await storage.open(FONT_CACHE);
    const hit = await cache.match(url);
    return hit ? await hit.arrayBuffer() : null;
  } catch {
    return null; // 隐私模式/配额问题：缓存不可用不影响导出
  }
}

async function writeToCache(url, buffer) {
  const storage = fontCache();
  if (!storage) return;
  try {
    const cache = await storage.open(FONT_CACHE);
    await cache.put(url, new Response(buffer, { headers: { 'Content-Type': 'font/ttf' } }));
  } catch (error) {
    // 忽略：缓存是优化，不是功能依赖（隐私模式/配额/老内核都会走到这里）
    if (typeof console !== 'undefined' && console.debug) console.debug('[pdf] 字体缓存写入失败', error?.message);
  }
}

async function loadPdfMake(fonts, fontFiles) {
  if (!pdfMakePromise) {
    pdfMakePromise = import('pdfmake/build/pdfmake')
      .then((module) => module.default || module)
      .catch((error) => {
        pdfMakePromise = null; // 一次失败不算数，下次重试
        throw error;
      });
  }
  const pdfMake = await pdfMakePromise;

  const vfs = {
    [fontFiles.normal]: fonts.normal,
    [fontFiles.bold]: fonts.bold
  };
  // pdfmake 0.3+ 用 addVirtualFileSystem 注册字体；旧版是直接赋 vfs 字段
  if (typeof pdfMake.addVirtualFileSystem === 'function') {
    pdfMake.addVirtualFileSystem(vfs);
  } else {
    pdfMake.vfs = { ...(pdfMake.vfs || {}), ...vfs };
  }
  const fontFamily = {
    normal: fontFiles.normal,
    bold: fontFiles.bold,
    italics: fontFiles.normal,
    bolditalics: fontFiles.bold
  };
  // pdfmake 0.3+ 用 addFonts 注册字体族
  if (typeof pdfMake.addFonts === 'function') {
    pdfMake.addFonts({ [FONT_ALIAS]: fontFamily });
  } else {
    pdfMake.fonts = { ...(pdfMake.fonts || {}), [FONT_ALIAS]: fontFamily };
  }
  return pdfMake;
}

/**
 * 加载字体（按层级缓存）；失败时清掉缓存，避免一次网络抖动之后永久失败。
 * @param {'core'|'full'} tier 核心子集（524KB，默认）或全量子集（1.1MB）
 */
export function loadPdfFonts({
  tier = 'core',
  force = false,
  timeoutMs = defaultFontTimeoutMs(),
  fetchImpl = fetch,
  bases = FONT_BASES
} = {}) {
  const fontFiles = FONT_SETS[tier] || FONT_SETS.core;
  if (force) fontsCache.delete(tier);
  if (!fontsCache.has(tier)) {
    const once = () => Promise.all([
      fetchFontBase64(fontFiles.normal, { fetchImpl, timeoutMs, bases }),
      fetchFontBase64(fontFiles.bold, { fetchImpl, timeoutMs, bases })
    ]);
    // 快速失败（如 DNS/连接被掐）自动重试一次；超时说明网慢，再等一轮只会更糟
    const promise = once()
      .catch((error) => (error?.timeout ? Promise.reject(error) : once()))
      .then(([normal, bold]) => ({ normal, bold }))
      .catch((error) => {
        fontsCache.delete(tier);
        throw error;
      });
    fontsCache.set(tier, promise);
  }
  return fontsCache.get(tier);
}

function normalizeFileName(filename) {
  const base = filename || 'tarot-analysis';
  return base.endsWith('.pdf') ? base : `${base}.pdf`;
}

/** 核心子集的覆盖区间（升序、闭区间），用于判断文本能否用核心字体渲染。 */
export function parseCoreRanges(payload) {
  const ranges = Array.isArray(payload?.ranges) ? payload.ranges : [];
  return ranges
    .filter((item) => Array.isArray(item) && item.length === 2 && item[0] <= item[1])
    .map(([start, end]) => [Number(start), Number(end)]);
}

/** 区间表里是否覆盖某个码点（二分查找）。 */
export function isCodePointCovered(ranges, codePoint) {
  let low = 0;
  let high = ranges.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const [start, end] = ranges[mid];
    if (codePoint < start) high = mid - 1;
    else if (codePoint > end) low = mid + 1;
    else return true;
  }
  return false;
}

/** 文本里第一个超出核心子集的字符（没有则返回 null）。 */
export function findUncoveredChar(ranges, text) {
  for (const char of String(text || '')) {
    const code = char.codePointAt(0);
    // 换行/制表等控制字符不参与覆盖判断：它们不渲染字形，字体 cmap 里本来也不会有
    if (code < 0x20 || code === 0x7F) continue;
    if (!isCodePointCovered(ranges, code)) return char;
  }
  return null;
}

function loadCoreRanges({ force = false, ...options } = {}) {
  if (force) coreIndexPromise = null;
  if (!coreIndexPromise) {
    coreIndexPromise = fetchResource(CORE_INDEX_FILE, options)
      .then((buffer) => parseCoreRanges(JSON.parse(decodeText(buffer))))
      .catch((error) => {
        coreIndexPromise = null;
        throw error;
      });
  }
  return coreIndexPromise;
}

/** ArrayBuffer → 文本：索引是纯 ASCII JSON，没有 TextDecoder 的环境也能解析。 */
function decodeText(buffer) {
  if (typeof TextDecoder === 'function') return new TextDecoder().decode(buffer);
  return String.fromCharCode(...new Uint8Array(buffer));
}

/**
 * 选字体层级：文本全部落在核心子集覆盖范围内就用核心（524KB，最适合慢网），
 * 出现生僻字/二级字则回退全量子集；索引拿不到时也走全量（宁可慢一点，不能缺字）。
 */
export async function pickFontTier(text, options = {}) {
  try {
    const ranges = await loadCoreRanges(options);
    const uncovered = findUncoveredChar(ranges, text);
    if (uncovered && typeof console !== 'undefined' && console.debug) {
      console.debug('[pdf] 核心字体缺字，改用全量字体：', uncovered, (uncovered.codePointAt(0) || 0).toString(16));
    }
    return uncovered ? 'full' : 'core';
  } catch (error) {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[pdf] 核心字体覆盖索引不可用，回退全量字体：', error?.message);
    }
    return 'full';
  }
}

/** 预加载（忽略失败）：进到 AI 结果页就悄悄下核心字体 + 覆盖索引，点导出时多半已就绪。 */
export function preloadPdfFonts(options = {}) {
  return Promise.all([
    loadPdfFonts(options).catch(() => null),
    loadCoreRanges(options).catch(() => null)
  ]).then(() => null);
}

/** 生成 PDF Blob：只生成、不落盘，真机上交给用户手势再保存。 */
async function runBuild(markdown, meta, fontOptions) {
  const text = `${markdown}\n${meta?.title || ''}\n${meta?.subtitle || ''}`;
  const tier = await pickFontTier(text, fontOptions);
  const fonts = await loadPdfFonts({ ...fontOptions, tier });
  const pdfMake = await loadPdfMake(fonts, FONT_SETS[tier]);
  return pdfMake.createPdf(buildPdfDefinition(markdown, meta)).getBlob();
}

/** 生成 PDF Blob：只生成、不落盘，真机上交给用户手势再保存。 */
export function buildPdfBlob(
  markdown,
  meta = {},
  { timeoutMs = PDF_BUILD_TIMEOUT_MS, fontTimeoutMs = PDF_FONT_TIMEOUT_MS, ...fontOptions } = {}
) {
  if (!markdown || !markdown.trim()) {
    return Promise.reject(new Error('没有可导出的 AI 内容'));
  }
  // 兜底：字体/引擎/排版任何一环卡住都要变成可重试的错误，而不是无限"正在生成"
  const task = runBuild(markdown, meta, { ...fontOptions, timeoutMs: fontTimeoutMs });
  // 外层先超时返回时，原始 promise 之后仍可能 reject —— 先吃掉，避免 unhandled rejection
  task.catch(() => {});
  return withTimeout(
    task,
    timeoutMs,
    `生成 PDF 超时（${Math.round(timeoutMs / 1000)}s），请检查网络后重试`
  );
}

/** 同步触发下载（锚点点击，桌面/Android Chrome 有效），返回 objectURL 供手工链接兜底。 */
export function downloadPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  return url;
}

export function releasePdfUrl(url) {
  if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

/** 系统分享面板能否直接收文件（iOS Safari 15+ / Android Chrome 支持）。 */
export function canSharePdf(blob, fileName) {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function' || typeof File !== 'function') {
    return false;
  }
  try {
    return navigator.canShare({ files: [new File([blob], fileName, { type: 'application/pdf' })] });
  } catch {
    return false;
  }
}

/**
 * 走系统分享保存文件。**必须在用户手势里调用**（手势会转成临时激活），否则会 NotAllowedError。
 * @returns {Promise<'shared'|'cancelled'|'failed'>}
 */
export async function sharePdfBlob(blob, fileName, title) {
  try {
    await navigator.share({
      files: [new File([blob], fileName, { type: 'application/pdf' })],
      title: title || fileName
    });
    return 'shared';
  } catch (error) {
    return error?.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

function defaultUserAgent() {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent;
}

function defaultTouchPoints() {
  return typeof navigator === 'undefined' ? 0 : navigator.maxTouchPoints || 0;
}

/**
 * 是不是 iOS/iPadOS：
 * iPadOS 13+ 的 Safari 会把 UA 伪装成 Macintosh，只能靠「Macintosh + 多点触控」识别。
 */
export function isIosDevice(userAgent = defaultUserAgent(), maxTouchPoints = defaultTouchPoints()) {
  const ua = userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return /Macintosh/.test(ua) && maxTouchPoints > 1;
}

/** 是不是移动端/触屏浏览器。 */
export function isMobileBrowser(userAgent = defaultUserAgent(), maxTouchPoints = defaultTouchPoints()) {
  return /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(userAgent || '')
    || isIosDevice(userAgent, maxTouchPoints);
}

/** 兼容旧调用：生成 + 尝试自动下载（桌面与 Android Chrome 有效，iOS 请配合手工链接）。 */
export async function exportMarkdownToPdf(markdown, filename, meta = {}) {
  const blob = await buildPdfBlob(markdown, meta);
  const fileName = normalizeFileName(filename);
  const url = downloadPdfBlob(blob, fileName);
  return { blob, url, fileName };
}

export { FONT_ALIAS, FONT_SETS, normalizeFileName };
