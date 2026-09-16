import MarkdownIt from 'markdown-it';
import markdownItMark from 'markdown-it-mark';
import markdownItMultiMdTable from 'markdown-it-multimd-table';

/**
 * AI 返回的 Markdown → pdfmake 的 content 数组。
 * 与 docx 版（docxMarkdown.js）共用同一套解析思路，区别是输出 pdfmake 的声明式结构。
 */

const FONT = 'NotoSC';
const ACCENT = '#A34A10';
const MUTED = '#6D6255';
const BORDER = '#E3C8A8';

export function parseMarkdown(markdown) {
  return new MarkdownIt({ html: false, linkify: true, breaks: true })
    .use(markdownItMark)
    .use(markdownItMultiMdTable, { multiline: true, header: true })
    .parse(markdown || '', {});
}

export function inlineRuns(children) {
  const runs = [];
  let bold = 0;
  let italics = 0;
  let decoration = null;
  let background = null;
  let color = null;

  const push = (text, extra = {}) => {
    if (!text) return;
    runs.push({
      text,
      bold: bold > 0 || undefined,
      italics: italics > 0 || undefined,
      color: color || undefined,
      background: background || undefined,
      ...(decoration ? { decoration } : {}),
      ...extra
    });
  };

  for (const token of children || []) {
    switch (token.type) {
      case 'text': push(token.content); break;
      case 'strong_open': bold += 1; break;
      case 'strong_close': bold -= 1; break;
      case 'em_open': italics += 1; break;
      case 'em_close': italics -= 1; break;
      case 's_open': decoration = 'lineThrough'; break;
      case 's_close': decoration = null; break;
      case 'mark_open': background = '#FBEEC4'; break;
      case 'mark_close': background = null; break;
      case 'link_open': color = ACCENT; break;
      case 'link_close': color = null; break;
      case 'code_inline': push(token.content, { background: '#F5EFE6', color: '#7A4A12' }); break;
      case 'softbreak':
      case 'hardbreak': push('\n'); break;
      default:
        if (!token.children && token.content) push(token.content);
    }
  }

  return runs.length ? runs : [{ text: '' }];
}

function buildListItems(tokens, startIndex, docxless) {
  // 逐项收集列表内容（支持一层嵌套）
  const items = [];
  let index = startIndex;
  let depth = 1;

  while (index < tokens.length && depth > 0) {
    const token = tokens[index];
    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') depth += 1;
    if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') depth -= 1;
    if (depth <= 0) break;

    if (token.type === 'list_item_open') {
      const inline = tokens[index + 2];
      const text = inlineRuns(inline?.children);
      // 嵌套列表：把紧随其后的子列表并入同一项
      let cursor = index + 3;
      let nested = null;
      if (tokens[cursor] && (tokens[cursor].type === 'bullet_list_open' || tokens[cursor].type === 'ordered_list_open')) {
        const nestedOrdered = tokens[cursor].type === 'ordered_list_open';
        const nestedItems = buildListItems(tokens, cursor + 1, docxless);
        nested = nestedOrdered ? { ol: nestedItems.items } : { ul: nestedItems.items };
        cursor = nestedItems.nextIndex;
      }
      items.push(nested ? { text, ...nested } : { text, margin: [0, 0, 0, 3] });
      index = cursor;
      continue;
    }
    index += 1;
  }

  return { items, nextIndex: index + 1 };
}

export function markdownToPdfContent(markdown, meta = {}) {
  const tokens = parseMarkdown(markdown);
  const content = [];

  if (meta.title) {
    content.push({ text: meta.title, style: 'docTitle' });
  }
  if (meta.subtitle) {
    content.push({ text: meta.subtitle, style: 'docSubtitle' });
  }

  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];

    if (token.type === 'heading_open') {
      const level = Math.min(Number(token.tag.slice(1)), 4);
      content.push({ text: inlineRuns(tokens[index + 1]?.children), style: `h${level}` });
      index += 3;
      continue;
    }

    if (token.type === 'paragraph_open') {
      content.push({ text: inlineRuns(tokens[index + 1]?.children), style: 'body' });
      index += 3;
      continue;
    }

    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const ordered = token.type === 'ordered_list_open';
      const { items, nextIndex } = buildListItems(tokens, index + 1, null);
      content.push(ordered ? { ol: items, margin: [0, 0, 0, 8] } : { ul: items, margin: [0, 0, 0, 8] });
      index = nextIndex;
      continue;
    }

    if (token.type === 'blockquote_open') {
      const inline = tokens[index + 2];
      content.push({
        text: inlineRuns(inline?.children),
        italics: true,
        color: MUTED,
        margin: [16, 2, 0, 10]
      });
      index += 4;
      continue;
    }

    if (token.type === 'fence' || token.type === 'code_block') {
      content.push({
        text: token.content.replace(/\n$/, ''),
        style: 'codeBlock',
        margin: [0, 4, 0, 10]
      });
      index += 1;
      continue;
    }

    if (token.type === 'hr') {
      content.push({
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: BORDER }],
        margin: [0, 6, 0, 10]
      });
      index += 1;
      continue;
    }

    if (token.type === 'table_open') {
      const body = [];
      let row = null;
      let cursor = index + 1;
      while (cursor < tokens.length && tokens[cursor].type !== 'table_close') {
        const current = tokens[cursor];
        if (current.type === 'tr_open') row = [];
        else if (current.type === 'th_open' || current.type === 'td_open') {
          const isHeader = current.type === 'th_open';
          row?.push({ text: inlineRuns(tokens[cursor + 1]?.children), bold: isHeader || undefined });
        } else if (current.type === 'tr_close' && row) {
          body.push(row);
          row = null;
        }
        cursor += 1;
      }
      if (body.length) {
        content.push({
          table: {
            headerRows: 1,
            widths: new Array(body[0].length).fill('*'),
            body
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => BORDER,
            vLineColor: () => BORDER,
            paddingLeft: () => 6,
            paddingRight: () => 6,
            paddingTop: () => 4,
            paddingBottom: () => 4
          },
          margin: [0, 4, 0, 12]
        });
      }
      index = cursor + 1;
      continue;
    }

    index += 1;
  }

  return content;
}

export function buildPdfDefinition(markdown, meta = {}) {
  const siteName = meta.siteName || 'TarotQA';
  const siteUrl = meta.siteUrl || 'tarot.goodvibez.cn';
  const copyright = meta.copyright || `© 2026 ${siteName} · ${siteUrl}`;
  const disclaimer = meta.disclaimer
    || '本结果由 AI 生成，仅供参考娱乐，不构成任何决策建议；命理内容不作为医疗、投资、法律依据。';

  const subtitle = [meta.subtitle, `由 ${siteName} 生成 · ${new Date().toLocaleString()}`]
    .filter(Boolean)
    .join(' · ');

  const content = markdownToPdfContent(markdown, { title: meta.title, subtitle });

  content.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: BORDER }],
    margin: [0, 18, 0, 10]
  });
  content.push({ text: '免责声明', style: 'disclaimerTitle' });
  content.push({ text: disclaimer, style: 'disclaimerBody' });
  content.push({ text: copyright, style: 'disclaimerBody' });

  return {
    pageSize: 'A4',
    pageMargins: [40, 64, 40, 56],
    content,
    defaultStyle: { font: FONT, fontSize: 10.5, lineHeight: 1.5, color: '#2F2A24' },
    header: (currentPage) => (currentPage === 1 ? undefined : {
      margin: [40, 24, 40, 0],
      columns: [
        { text: `${siteName} · ${meta.title || 'AI 解读'}`, fontSize: 8, color: MUTED },
        { text: new Date().toLocaleDateString(), fontSize: 8, color: MUTED, alignment: 'right' }
      ]
    }),
    footer: (currentPage, pageCount) => ({
      margin: [40, 0, 40, 24],
      columns: [
        { text: `第 ${currentPage} / ${pageCount} 页`, fontSize: 8, color: MUTED },
        { text: siteUrl, fontSize: 8, color: MUTED, alignment: 'right' }
      ]
    }),
    styles: {
      docTitle: { fontSize: 20, bold: true, margin: [0, 0, 0, 4] },
      docSubtitle: { fontSize: 9, color: MUTED, margin: [0, 0, 0, 14] },
      h1: { fontSize: 17, bold: true, margin: [0, 12, 0, 6] },
      h2: { fontSize: 14, bold: true, margin: [0, 12, 0, 6] },
      h3: { fontSize: 12, bold: true, color: '#6B4A16', margin: [0, 10, 0, 4] },
      h4: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] },
      body: { margin: [0, 0, 0, 7] },
      codeBlock: { fontSize: 9, color: '#7A4A12', background: '#F5EFE6', preserveLeadingSpaces: true },
      disclaimerTitle: { fontSize: 10, bold: true, color: '#5A5045', margin: [0, 0, 0, 4] },
      disclaimerBody: { fontSize: 8.5, color: MUTED, margin: [0, 0, 0, 3] }
    }
  };
}
