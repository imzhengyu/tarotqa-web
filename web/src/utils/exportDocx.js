/**
 * 把 AI 返回的 Markdown 导出为格式完整的 Word (.docx) 文档。
 *
 * 只导出 AI 的 Markdown 正文 + 一小段元信息表头，不再走 html2canvas 截图。
 * docx 库体积较大，这里动态 import，避免影响首屏体积。
 */
import { buildDocument } from './docxMarkdown';

async function loadDocx() {
  return import('docx');
}

/** 生成 .docx 的 Buffer（Node 环境用于抽样验证） */
export async function buildDocxBuffer(markdown, meta = {}) {
  const docx = await loadDocx();
  return docx.Packer.toBuffer(buildDocument(docx, markdown, meta));
}

/** 生成 .docx 的 Blob（浏览器导出） */
export async function buildDocxBlob(markdown, meta = {}) {
  const docx = await loadDocx();
  return docx.Packer.toBlob(buildDocument(docx, markdown, meta));
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * @param {string} markdown  AI 返回的 Markdown 原文
 * @param {string} filename  不含扩展名的文件名
 * @param {{title?: string, subtitle?: string}} meta 文档标题与副标题（如牌阵/出生信息）
 */
export async function exportMarkdownToDocx(markdown, filename, meta = {}) {
  if (!markdown || !markdown.trim()) {
    throw new Error('没有可导出的 AI 内容');
  }
  const blob = await buildDocxBlob(markdown, meta);
  triggerDownload(blob, filename);
}
