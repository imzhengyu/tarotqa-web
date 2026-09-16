import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { markdownToPdfContent, buildPdfDefinition } from '../../utils/pdfMarkdown';
import { exportMarkdownToPdf, FONT_FILES } from '../../utils/exportPdf';

vi.mock('pdfmake/build/pdfmake', () => ({
  default: {
    addVirtualFileSystem: vi.fn(),
    addFonts: vi.fn(),
    createPdf: () => ({ download: (name, done) => done && done(name) })
  }
}));

const SAMPLE = [
  '## 命盘总览',
  '',
  '核心结论是 **紫微天府坐命**，并注意 ==身宫落官禄==。',
  '',
  '- 第一点建议',
  '- 第二点建议',
  '',
  '| 宫位 | 主星 |',
  '| --- | --- |',
  '| 命宫 | 紫微天府 |',
  '',
  '> 引用提示',
  ''
].join('\n');

describe('AI Markdown → PDF', () => {
  it('标题/段落/列表/表格/引用都能转成 pdfmake 结构', () => {
    const content = markdownToPdfContent(SAMPLE, { title: '紫微斗数 · AI 解读', subtitle: '1990-06-15' });
    const dump = JSON.stringify(content);

    expect(dump).toContain('紫微斗数 · AI 解读');   // 标题
    expect(dump).toContain('"style":"h2"');        // Markdown 二级标题
    expect(dump).toContain('"ul"');                 // 无序列表
    expect(dump).toContain('"table"');              // 表格
    expect(dump).toContain('身宫落官禄');           // ==高亮== 文本保留
  });

  it('文档定义包含内容、分页页眉页脚与免责声明', () => {
    const definition = buildPdfDefinition(SAMPLE, { title: 't', siteName: 'TarotQA', siteUrl: 'tarot.goodvibez.cn' });

    expect(Array.isArray(definition.content)).toBe(true);
    expect(definition.content.length).toBeGreaterThan(4);
    expect(typeof definition.header).toBe('function');
    expect(typeof definition.footer).toBe('function');
    expect(JSON.stringify(definition.content)).toContain('免责声明');
    expect(JSON.stringify(definition.content)).toContain('tarot.goodvibez.cn');

    const footer = definition.footer(2, 4);
    expect(JSON.stringify(footer)).toContain('第 2 / 4 页');
  });

  describe('浏览器导出管道', () => {
    beforeEach(() => {
      // 字体走 fetch；下载走 URL.createObjectURL（jsdom 未实现）
      global.fetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
      global.URL.createObjectURL = vi.fn(() => 'blob:mock');
      global.URL.revokeObjectURL = vi.fn();
      vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
      delete global.fetch;
    });

    it('加载字体 → 注册字体族 → 触发下载', async () => {
      const pdfMake = (await import('pdfmake/build/pdfmake')).default;
      await exportMarkdownToPdf(SAMPLE, 'sample', { title: 't' });

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(FONT_FILES.normal));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(FONT_FILES.bold));
      expect(pdfMake.addVirtualFileSystem).toHaveBeenCalled();
      expect(pdfMake.addFonts).toHaveBeenCalledWith(
        expect.objectContaining({ NotoSC: expect.objectContaining({ normal: FONT_FILES.normal }) })
      );
    });

    it('没有内容时直接报错，不去加载字体', async () => {
      await expect(exportMarkdownToPdf('   ', 'x')).rejects.toThrow('没有可导出的 AI 内容');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
