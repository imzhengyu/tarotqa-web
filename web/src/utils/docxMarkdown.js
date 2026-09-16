import MarkdownIt from 'markdown-it';
import markdownItMark from 'markdown-it-mark';
import markdownItMultiMdTable from 'markdown-it-multimd-table';

/**
 * 把 AI 返回的 Markdown 转成 docx 的块级元素（标题 / 段落 / 列表 / 表格 / 代码 / 引用）。
 * 设计成"接收 docx 命名空间"的纯函数，便于单测，也让 docx 这个较大的库保持动态 import。
 */

const FONT = 'Microsoft YaHei';
const CODE_FONT = 'Consolas';
const ACCENT = 'A34A10';
const MUTED = '6D6255';

export function parseMarkdown(markdown) {
  return new MarkdownIt({ html: false, linkify: true, breaks: true })
    .use(markdownItMark)
    .use(markdownItMultiMdTable, { multiline: true, header: true })
    .parse(markdown || '', {});
}

export function inlineRuns(children, docx, inherited = {}) {
  const runs = [];
  let bold = 0;
  let italic = 0;
  let strike = 0;
  let highlight = 0;
  let accent = 0;

  const push = (text, extra = {}) => {
    runs.push(
      new docx.TextRun({
        text,
        font: inherited.code ? CODE_FONT : FONT,
        bold: bold > 0 || inherited.bold,
        italics: italic > 0,
        strike: strike > 0,
        color: accent > 0 ? ACCENT : inherited.color,
        highlight: highlight > 0 ? 'yellow' : undefined,
        ...extra
      })
    );
  };

  for (const token of children || []) {
    switch (token.type) {
      case 'text': push(token.content); break;
      case 'strong_open': bold += 1; break;
      case 'strong_close': bold -= 1; break;
      case 'em_open': italic += 1; break;
      case 'em_close': italic -= 1; break;
      case 's_open': strike += 1; break;
      case 's_close': strike -= 1; break;
      case 'mark_open': highlight += 1; break;
      case 'mark_close': highlight -= 1; break;
      case 'link_open': accent += 1; break;
      case 'link_close': accent -= 1; break;
      case 'code_inline': push(token.content, { font: CODE_FONT, shading: { fill: 'F5EFE6' } }); break;
      case 'softbreak':
      case 'hardbreak': push('\n'); break;
      default:
        if (!token.children && token.content) push(token.content);
    }
  }

  return runs.length ? runs : [new docx.TextRun({ text: '' })];
}

export function markdownToDocxChildren(markdown, docx, meta = {}) {
  const tokens = parseMarkdown(markdown);
  const children = [];
  const headingLevels = {
    1: docx.HeadingLevel.HEADING_1,
    2: docx.HeadingLevel.HEADING_2,
    3: docx.HeadingLevel.HEADING_3,
    4: docx.HeadingLevel.HEADING_4
  };

  if (meta.title) {
    children.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: meta.title, bold: true, size: 32, font: FONT })],
      spacing: { after: 120 }
    }));
  }
  if (meta.subtitle) {
    children.push(new docx.Paragraph({
      children: [new docx.TextRun({ text: meta.subtitle, size: 20, color: MUTED, font: FONT })],
      spacing: { after: 240 }
    }));
  }

  let listStack = [];
  let quoteDepth = 0;
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];

    if (token.type === 'heading_open') {
      const inline = tokens[index + 1];
      children.push(new docx.Paragraph({
        children: inlineRuns(inline?.children, docx),
        heading: headingLevels[Number(token.tag.slice(1))] || docx.HeadingLevel.HEADING_4,
        spacing: { before: 240, after: 120 }
      }));
      index += 3;
      continue;
    }

    if (token.type === 'paragraph_open') {
      const inline = tokens[index + 1];
      children.push(new docx.Paragraph({
        children: inlineRuns(inline?.children, docx),
        indent: quoteDepth > 0 ? { left: 360 * quoteDepth } : undefined,
        spacing: { after: 140 }
      }));
      index += 3;
      continue;
    }

    if (token.type === 'bullet_list_open') { listStack.push(false); index += 1; continue; }
    if (token.type === 'ordered_list_open') { listStack.push(true); index += 1; continue; }
    if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
      listStack.pop();
      index += 1;
      continue;
    }
    if (token.type === 'list_item_open') {
      const inline = tokens[index + 2];
      const ordered = listStack[listStack.length - 1];
      const prefix = ordered ? `${listStack.filter(Boolean).length}. ` : '• ';
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: prefix, font: FONT }), ...inlineRuns(inline?.children, docx)],
        indent: { left: 360 * Math.max(listStack.length, 1) },
        spacing: { after: 60 }
      }));
      index += 3;
      continue;
    }

    if (token.type === 'blockquote_open') { quoteDepth += 1; index += 1; continue; }
    if (token.type === 'blockquote_close') { quoteDepth -= 1; index += 1; continue; }

    if (token.type === 'fence' || token.type === 'code_block') {
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: token.content.replace(/\n$/, ''), font: CODE_FONT, size: 18 })],
        shading: { fill: 'F5EFE6' },
        spacing: { before: 120, after: 200 }
      }));
      index += 1;
      continue;
    }

    if (token.type === 'hr') {
      children.push(new docx.Paragraph({
        children: [new docx.TextRun({ text: '' })],
        border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: 'E3C8A8' } },
        spacing: { before: 120, after: 200 }
      }));
      index += 1;
      continue;
    }

    if (token.type === 'table_open') {
      const rows = [];
      let currentRow = null;
      let cursor = index + 1;
      while (cursor < tokens.length && tokens[cursor].type !== 'table_close') {
        const current = tokens[cursor];
        if (current.type === 'tr_open') currentRow = [];
        else if (current.type === 'th_open' || current.type === 'td_open') {
          currentRow?.push(inlineRuns(tokens[cursor + 1]?.children, docx));
        } else if (current.type === 'tr_close' && currentRow) {
          rows.push(currentRow);
          currentRow = null;
        }
        cursor += 1;
      }
      if (rows.length) {
        children.push(new docx.Table({
          width: { size: 100, type: docx.WidthType.PERCENTAGE },
          rows: rows.map((cells, rowIndex) => new docx.TableRow({
            children: cells.map((cellRuns) => new docx.TableCell({
              children: [new docx.Paragraph({ children: cellRuns, spacing: { after: 0 } })],
              shading: rowIndex === 0 ? { fill: 'FDF1E2' } : undefined
            }))
          }))
        }));
        children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: '' })], spacing: { after: 160 } }));
      }
      index = cursor + 1;
      continue;
    }

    index += 1;
  }

  return children;
}

export function buildDocument(docx, markdown, meta = {}) {
  const siteName = meta.siteName || 'TarotQA';
  const siteUrl = meta.siteUrl || 'tarot.goodvibez.cn';
  const copyright = meta.copyright || `© 2026 ${siteName} · ${siteUrl}`;
  const disclaimer = meta.disclaimer
    || '本结果由 AI 生成，仅供参考娱乐，不构成任何决策建议；命理内容不作为医疗、投资、法律依据。';
  const subtitleText = [meta.subtitle, `由 ${siteName} 生成 · ${new Date().toLocaleString()}`]
    .filter(Boolean)
    .join(' · ');

  const children = markdownToDocxChildren(markdown, docx, { title: meta.title, subtitle: subtitleText });

  // 结尾免责声明 + 版权信息（独立区块，与正文拉开距离）
  children.push(new docx.Paragraph({
    children: [new docx.TextRun({ text: '' })],
    border: { bottom: { style: docx.BorderStyle.SINGLE, size: 6, color: 'E3C8A8' } },
    spacing: { before: 320, after: 200 }
  }));
  children.push(new docx.Paragraph({
    children: [new docx.TextRun({ text: '免责声明', bold: true, size: 18, font: FONT, color: '5A5045' })],
    spacing: { after: 80 }
  }));
  children.push(new docx.Paragraph({
    children: [new docx.TextRun({ text: disclaimer, size: 16, color: MUTED, font: FONT })],
    spacing: { after: 120 }
  }));
  children.push(new docx.Paragraph({
    children: [new docx.TextRun({ text: `${copyright}`, size: 16, color: MUTED, font: FONT })],
    spacing: { after: 0 }
  }));

  return new docx.Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: '2F2A24' },
          paragraph: { spacing: { line: 360 } }
        }
      }
    },
    sections: [{
      properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
      headers: {
        default: new docx.Header({
          children: [new docx.Paragraph({
            border: { bottom: { style: docx.BorderStyle.SINGLE, size: 4, color: 'E3C8A8' } },
            children: [
              new docx.TextRun({ text: `${siteName} · ${meta.title || 'AI 解读'}`, size: 16, color: MUTED, font: FONT })
            ],
            spacing: { after: 80 }
          })]
        })
      },
      footers: {
        default: new docx.Footer({
          children: [
            new docx.Paragraph({
              alignment: docx.AlignmentType.CENTER,
              children: [
                new docx.TextRun({ text: `第 `, size: 16, color: MUTED, font: FONT }),
                new docx.TextRun({ children: [docx.PageNumber.CURRENT], size: 16, color: MUTED, font: FONT }),
                new docx.TextRun({ text: ' / ', size: 16, color: MUTED, font: FONT }),
                new docx.TextRun({ children: [docx.PageNumber.TOTAL_PAGES], size: 16, color: MUTED, font: FONT }),
                new docx.TextRun({ text: ` 页 · ${siteUrl}`, size: 16, color: MUTED, font: FONT })
              ]
            })
          ]
        })
      },
      children
    }]
  });
}
