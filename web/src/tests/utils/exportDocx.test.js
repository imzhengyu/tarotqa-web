import { describe, it, expect } from 'vitest';
import * as docx from 'docx';
import { markdownToDocxChildren, buildDocument } from '../../utils/docxMarkdown';
import { buildDocxBlob } from '../../utils/exportDocx';

// 覆盖 AI 实际会返回的几种结构：标题、加粗、==高亮==、列表、表格、代码块
const SAMPLE = [
  '## 综合解读',
  '',
  '核心牌意 **世界**，并注意 ==月亮（逆位）== 的提示。',
  '',
  '- 第一点建议',
  '- 第二点建议',
  '',
  '| 牌位 | 牌 | 倾向 |',
  '| --- | --- | --- |',
  '| 核心 | 世界 | 收尾 |',
  '',
  '```js',
  'console.log(1)',
  '```',
  ''
].join('\n');

describe('AI Markdown → docx', () => {
  it('标题/段落/列表/表格/代码块都能转成 docx 元素', () => {
    const children = markdownToDocxChildren(SAMPLE, docx);
    const dump = JSON.stringify(children);

    expect(dump).toContain('综合解读');
    expect(dump).toContain('核心牌意');
    expect(dump).toContain('• ');            // 无序列表项
    expect(dump).toContain('console.log'); // 代码块
    expect(children.some((node) => node.constructor.name === 'Table')).toBe(true);
  });

  it('文档包含标题、副标题与页脚免责声明', () => {
    const document = buildDocument(docx, SAMPLE, { title: '塔罗占卜 · AI 深度解读', subtitle: '单牌阵 · 1 张牌' });
    const dump = JSON.stringify(document);

    expect(dump).toContain('塔罗占卜 · AI 深度解读');
    expect(dump).toContain('单牌阵 · 1 张牌');
    expect(dump).toContain('仅供参考娱乐');
  });

  it('导出的是真正的 docx（zip 头 PK，且体积合理）', async () => {
    const blob = await buildDocxBlob(SAMPLE, { title: 't' });
    expect(blob.size).toBeGreaterThan(2000);

    const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
    expect(String.fromCharCode(head[0], head[1])).toBe('PK');
  });
});
