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
const FONT_BASE = `${(import.meta.env && import.meta.env.BASE_URL) || '/'}fonts/`;
const FONT_FILES = {
  // 用 TTF：pdfkit/fontkit 对 woff2 的支持依赖构建环境，TTF 一定可用
  normal: 'noto-sans-sc-400.ttf',
  bold: 'noto-sans-sc-700.ttf'
};
const FONT_ALIAS = 'NotoSC';

// 字体 2.4MB×2、pdfmake 也不小：缓存住，第二次导出不再走网络（尽量空间换时间）
let fontsPromise = null;
let pdfMakePromise = null;

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = '';
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(index, index + chunk));
  }
  return window.btoa(binary);
}

async function fetchFontBase64(fileName, fetchImpl = fetch) {
  const response = await fetchImpl(`${FONT_BASE}${fileName}`);
  if (!response.ok) {
    throw new Error(`字体加载失败：${fileName}（${response.status}）`);
  }
  return toBase64(await response.arrayBuffer());
}

async function loadPdfMake(fonts) {
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
    [FONT_FILES.normal]: fonts.normal,
    [FONT_FILES.bold]: fonts.bold
  };
  // pdfmake 0.3+ 用 addVirtualFileSystem 注册字体；旧版是直接赋 vfs 字段
  if (typeof pdfMake.addVirtualFileSystem === 'function') {
    pdfMake.addVirtualFileSystem(vfs);
  } else {
    pdfMake.vfs = { ...(pdfMake.vfs || {}), ...vfs };
  }
  const fontFamily = {
    normal: FONT_FILES.normal,
    bold: FONT_FILES.bold,
    italics: FONT_FILES.normal,
    bolditalics: FONT_FILES.bold
  };
  // pdfmake 0.3+ 用 addFonts 注册字体族
  if (typeof pdfMake.addFonts === 'function') {
    pdfMake.addFonts({ [FONT_ALIAS]: fontFamily });
  } else {
    pdfMake.fonts = { ...(pdfMake.fonts || {}), [FONT_ALIAS]: fontFamily };
  }
  return pdfMake;
}

/** 加载字体（带缓存）；失败时清掉缓存，避免一次网络抖动之后永久失败。 */
export function loadPdfFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFontBase64(FONT_FILES.normal),
      fetchFontBase64(FONT_FILES.bold)
    ])
      .then(([normal, bold]) => ({ normal, bold }))
      .catch((error) => {
        fontsPromise = null;
        throw error;
      });
  }
  return fontsPromise;
}

function normalizeFileName(filename) {
  const base = filename || 'tarot-analysis';
  return base.endsWith('.pdf') ? base : `${base}.pdf`;
}

/** 生成 PDF Blob：只生成、不落盘，真机上交给用户手势再保存。 */
export async function buildPdfBlob(markdown, meta = {}) {
  if (!markdown || !markdown.trim()) {
    throw new Error('没有可导出的 AI 内容');
  }
  const fonts = await loadPdfFonts();
  const pdfMake = await loadPdfMake(fonts);
  return pdfMake.createPdf(buildPdfDefinition(markdown, meta)).getBlob();
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

export { FONT_ALIAS, FONT_FILES, normalizeFileName };
