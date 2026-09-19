import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { markdownToPdfContent, buildPdfDefinition } from '../../utils/pdfMarkdown';
import {
  buildPdfBlob,
  canSharePdf,
  downloadPdfBlob,
  exportMarkdownToPdf,
  isIosDevice,
  isMobileBrowser,
  normalizeFileName,
  releasePdfUrl,
  sharePdfBlob,
  FONT_FILES
} from '../../utils/exportPdf';

vi.mock('pdfmake/build/pdfmake', () => ({
  default: {
    addVirtualFileSystem: vi.fn(),
    addFonts: vi.fn(),
    // pdfmake 0.3 的 API：createPdf(...).getBlob() 返回 Promise<Blob>，
    // 没有 download(filename, callback) 这种老签名
    createPdf: () => ({ getBlob: async () => new Blob(['%PDF-1.4'], { type: 'application/pdf' }) })
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

    it('生成 PDF：加载字体 → 注册字体族 → 返回 PDF Blob', async () => {
      const pdfMake = (await import('pdfmake/build/pdfmake')).default;
      const blob = await buildPdfBlob(SAMPLE, { title: 't' });

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(FONT_FILES.normal));
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(FONT_FILES.bold));
      expect(pdfMake.addVirtualFileSystem).toHaveBeenCalled();
      expect(pdfMake.addFonts).toHaveBeenCalledWith(
        expect.objectContaining({ NotoSC: expect.objectContaining({ normal: FONT_FILES.normal }) })
      );
      await expect(blob.text()).resolves.toContain('%PDF-1.4');
    });

    it('没有内容时直接报错，不去加载字体', async () => {
      await expect(buildPdfBlob('   ', {})).rejects.toThrow('没有可导出的 AI 内容');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('移动端保存路径', () => {
    const BLOB = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

    beforeEach(() => {
      global.URL.createObjectURL = vi.fn(() => 'blob:mock');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      delete global.navigator.canShare;
      delete global.navigator.share;
    });

    it('锚点下载：带 download 属性、点击后移除节点，并返回可复用的 objectURL', () => {
      const clicked = [];
      vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(function spy() {
        clicked.push({ href: this.href, download: this.download, inDom: document.body.contains(this) });
      });

      const url = downloadPdfBlob(BLOB, 'a.pdf');

      expect(url).toBe('blob:mock');
      expect(clicked).toEqual([{ href: 'blob:mock', download: 'a.pdf', inDom: true }]);
      expect(document.querySelector('a[download="a.pdf"]')).toBeNull(); // 点击后已移除

      releasePdfUrl(url);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });

    it.each([
      ['缺 navigator.canShare', () => {}, false],
      ['canShare 返回 false', () => { global.navigator.canShare = () => false; }, false],
      ['canShare 返回 true', () => { global.navigator.canShare = () => true; }, true],
      ['canShare 抛异常', () => { global.navigator.canShare = () => { throw new Error('boom'); }; }, false]
    ])('%s → canSharePdf 返回 %s', (_label, setup, expected) => {
      setup();
      expect(canSharePdf(BLOB, 'a.pdf')).toBe(expected);
    });

    it.each([
      ['分享成功', () => Promise.resolve(), 'shared'],
      ['用户取消', () => Promise.reject(Object.assign(new Error('cancel'), { name: 'AbortError' })), 'cancelled'],
      ['分享不支持（手势已失效等）', () => Promise.reject(new TypeError('NotAllowed')), 'failed']
    ])('%s → sharePdfBlob 返回 %s', async (_label, impl, expected) => {
      global.navigator.share = vi.fn(impl);
      await expect(sharePdfBlob(BLOB, 'a.pdf', '标题')).resolves.toBe(expected);
      expect(global.navigator.share).toHaveBeenCalledWith(
        expect.objectContaining({ title: '标题', files: [expect.objectContaining({ name: 'a.pdf' })] })
      );
    });

    it.each([
      ['iOS Safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6) AppleWebKit/605.1.15 Safari/604.1', true],
      ['Android Chrome', 'Mozilla/5.0 (Linux; Android 13; Pixel 5) Chrome/119 Mobile Safari/537.36', true],
      ['鸿蒙', 'Mozilla/5.0 (Phone; HarmonyOS 4.0) AppleWebKit/537.36', true],
      ['桌面 Windows', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119 Safari/537.36', false]
    ])('%s 识别为移动端：%s', (_label, ua, expected) => {
      expect(isMobileBrowser(ua)).toBe(expected);
    });

    it.each([
      ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6) AppleWebKit/605.1.15', 5, true],
      ['iPad 经典 UA', 'Mozilla/5.0 (iPad; CPU OS 16_6) AppleWebKit/605.1.15', 5, true],
      ['iPadOS 13+ 伪装成 Mac', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', 5, true],
      ['真 Mac（无触控）', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15', 0, false],
      ['Android', 'Mozilla/5.0 (Linux; Android 13; Pixel 5) Chrome/119 Mobile', 5, false]
    ])('%s 识别为 iOS：%s', (_label, ua, touchPoints, expected) => {
      expect(isIosDevice(ua, touchPoints)).toBe(expected);
    });
  });

  describe('文件名归一化', () => {
    it.each([
      ['tarot-三牌阵', 'tarot-三牌阵.pdf'],
      ['tarot.pdf', 'tarot.pdf'],
      ['', 'tarot-analysis.pdf'],
      [undefined, 'tarot-analysis.pdf']
    ])('%s → %s', (input, expected) => {
      expect(normalizeFileName(input)).toBe(expected);
    });
  });

  describe('兼容旧调用 exportMarkdownToPdf', () => {
    it('生成并立即触发一次下载，返回文件名与 Blob', async () => {
      global.fetch = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
      global.URL.createObjectURL = vi.fn(() => 'blob:mock');
      vi.spyOn(window.HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

      const result = await exportMarkdownToPdf(SAMPLE, 'legacy', { title: 't' });

      expect(result.fileName).toBe('legacy.pdf');
      expect(result.url).toBe('blob:mock');
      await expect(result.blob.text()).resolves.toContain('%PDF-1.4');
    });
  });
});
