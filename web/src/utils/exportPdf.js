/**
 * AI 解读导出 PDF：pdfmake + 本地化的 Noto Sans SC 子集字体。
 *
 * 之所以自带字体：PDF 必须内嵌字体才能保证中文在任何设备上显示一致；
 * 字体文件放在 web/public/fonts/（约 2.2MB，浏览器会缓存），只有点导出时才加载。
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
  const module = await import('pdfmake/build/pdfmake');
  const pdfMake = module.default || module;

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

/** 浏览器：加载字体 → 生成 PDF 并触发下载 */
export async function exportMarkdownToPdf(markdown, filename, meta = {}) {
  if (!markdown || !markdown.trim()) {
    throw new Error('没有可导出的 AI 内容');
  }

  const [normal, bold] = await Promise.all([
    fetchFontBase64(FONT_FILES.normal),
    fetchFontBase64(FONT_FILES.bold)
  ]);
  const pdfMake = await loadPdfMake({ normal, bold });
  const definition = buildPdfDefinition(markdown, meta);
  const name = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  await new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(definition).download(name, resolve);
    } catch (error) {
      reject(error);
    }
  });
}

export { FONT_ALIAS, FONT_FILES };
