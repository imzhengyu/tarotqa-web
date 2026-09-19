import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { markdownToPdfContent, buildPdfDefinition } from '../../utils/pdfMarkdown';
import {
  buildPdfBlob,
  canSharePdf,
  downloadPdfBlob,
  FONT_BASES,
  exportMarkdownToPdf,
  defaultFontTimeoutMs,
  loadPdfFonts,
  PDF_FONT_TIMEOUT_SLOW_MS,
  PDF_FONT_TIMEOUT_MS,
  preloadPdfFonts,
  isIosDevice,
  isMobileBrowser,
  normalizeFileName,
  releasePdfUrl,
  sharePdfBlob,
  FONT_SETS,
  findUncoveredChar,
  isCodePointCovered,
  parseCoreRanges,
  pickFontTier
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
      global.fetch = vi.fn(async (url) => ({
        ok: true,
        arrayBuffer: async () => (String(url).endsWith('noto-sans-sc-core-ranges.json')
          // 覆盖索引：SAMPLE 用到的 ASCII/汉字/中文标点都在核心集里 → 走核心字体
          ? new TextEncoder().encode(JSON.stringify({
            ranges: [[0x20, 0x7E], [0x3000, 0x303F], [0x4E00, 0x9FA5], [0xFF00, 0xFFEF]]
          })).buffer
          : new ArrayBuffer(8))
      }));
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

      // 第二个参数带 AbortSignal（超时用），只断言 URL 与"带 signal"即可
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(FONT_SETS.core.normal),
        expect.objectContaining({ signal: expect.anything() })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(FONT_SETS.core.bold),
        expect.objectContaining({ signal: expect.anything() })
      );
      expect(pdfMake.addVirtualFileSystem).toHaveBeenCalled();
      expect(pdfMake.addFonts).toHaveBeenCalledWith(
        expect.objectContaining({ NotoSC: expect.objectContaining({ normal: FONT_SETS.core.normal }) })
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

  // 站点在 GitHub Pages，国内网络经常"连上了但不回包"：没有超时就会永远停在"正在生成 PDF…"
  describe('网络卡死不能无限等待', () => {
    const hangingFetch = (_url, options = {}) => new Promise((_resolve, reject) => {
      // 真实浏览器里 fetch 会因 signal 中止而 reject，这里如实模拟
      options.signal?.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    });

    it('字体下载卡住 → 超时后抛出可重试的错误（不是静默等待）', async () => {
      await expect(
        loadPdfFonts({ force: true, fetchImpl: hangingFetch, timeoutMs: 40 })
      ).rejects.toThrow(/资源下载超时：noto-sans-sc-core-400\.ttf（0s，已尝试 \d+ 个源，请检查网络后重试）/);
    });

    it('整体生成卡住 → 由外层超时兜底，错误文案带"超时/重试"', async () => {
      await expect(
        buildPdfBlob(SAMPLE, {}, { timeoutMs: 30, force: true, fontTimeoutMs: 80, fetchImpl: hangingFetch })
      ).rejects.toThrow(/超时.*重试/);
    });

    it('字体请求第一次失败会自动重试一次', async () => {
      let calls = 0;
      const flakyFetch = async (_url) => {
        calls += 1;
        if (calls <= 2) throw new TypeError('Failed to fetch');
        return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
      };
      await expect(loadPdfFonts({ force: true, fetchImpl: flakyFetch, timeoutMs: 200 })).resolves.toEqual({
        normal: expect.any(String),
        bold: expect.any(String)
      });
      expect(calls).toBe(4); // 第一次两个字体都失败 → 重试的两个都成功
    });

    it('超时不再自动重试（否则用户要白等两轮 20s）', async () => {
      let calls = 0;
      const timeoutFetch = (_url, options = {}) => {
        calls += 1;
        return new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
          });
        });
      };
      await expect(loadPdfFonts({ force: true, fetchImpl: timeoutFetch, timeoutMs: 30 })).rejects.toThrow(/超时/);
      expect(calls).toBe(2); // 两个字体各请求一次，没有第二轮
    });

    it('预加载失败不抛错（后台任务不能把页面搞崩）', async () => {
      await expect(
        preloadPdfFonts({ force: true, fetchImpl: () => Promise.reject(new TypeError('offline')), timeoutMs: 50 })
      ).resolves.toBeNull();
    });

    it.each([
      ['WiFi/4G', { effectiveType: '4g' }, PDF_FONT_TIMEOUT_MS],
      ['3G', { effectiveType: '3g' }, PDF_FONT_TIMEOUT_SLOW_MS],
      ['2G', { effectiveType: '2g' }, PDF_FONT_TIMEOUT_SLOW_MS],
      ['省流量模式', { effectiveType: '4g', saveData: true }, PDF_FONT_TIMEOUT_SLOW_MS],
      ['拿不到网络信息', null, PDF_FONT_TIMEOUT_MS]
    ])('%s 的字体下载预算：%s ms', (_label, connection, expected) => {
      expect(defaultFontTimeoutMs(connection)).toBe(expected);
    });
  });

  // 字体与站点解耦：多源回退 + Cache Storage 持久缓存
  describe('字体源与缓存（国内可访问性）', () => {
    const okFetch = (buffer = new ArrayBuffer(8)) => async () => ({
      ok: true,
      arrayBuffer: async () => buffer
    });

    beforeEach(() => {
      // jsdom 不提供 Response：给个最小实现，让 Cache Storage 路径可测
      global.Response = global.Response || class {
        constructor(buffer) {
          this._buffer = buffer;
        }

        async arrayBuffer() {
          return this._buffer;
        }
      };
    });

    afterEach(() => {
      delete global.caches;
    });

    it('同源是最后一个兜底源（国内镜像排在前面）', () => {
      expect(FONT_BASES.at(-1)).toMatch(/\/fonts\/$/);
      expect(FONT_BASES.length).toBeGreaterThanOrEqual(1);
    });

    it('第一个源失败时自动换下一个源，最终成功', async () => {
      const tried = [];
      const fetchImpl = async (url) => {
        tried.push(url);
        if (url.startsWith('https://mirror.example.com/')) throw new TypeError('Failed to fetch');
        return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
      };

      await expect(
        loadPdfFonts({
          force: true,
          fetchImpl,
          timeoutMs: 200,
          bases: ['https://mirror.example.com/cdn/fonts/', '/fonts/']
        })
      ).resolves.toEqual({ normal: expect.any(String), bold: expect.any(String) });

      expect(tried).toContain('https://mirror.example.com/cdn/fonts/noto-sans-sc-core-400.ttf');
      expect(tried).toContain('/fonts/noto-sans-sc-core-400.ttf');
    });

    it('下载成功后写进 Cache Storage，第二次导出直接命中缓存（不再走网络）', async () => {
      const store = new Map();
      const openSpy = vi.fn();
      global.caches = {
        open: async (...args) => {
          openSpy(...args);
          return {
            match: async (url) => {
              const hit = store.get(url);
              return hit ? { arrayBuffer: async () => hit } : null;
            },
            put: async (url, response) => {
              store.set(url, await response.arrayBuffer());
            }
          };
        }
      };

      const first = await loadPdfFonts({ force: true, fetchImpl: okFetch(new ArrayBuffer(16)), timeoutMs: 200 });
      expect(openSpy).toHaveBeenCalled();
      expect(store.size).toBe(2);
      expect([...store.keys()]).toEqual([
        '/fonts/noto-sans-sc-core-400.ttf',
        '/fonts/noto-sans-sc-core-700.ttf'
      ]);

      // 断网重来：缓存里已有 → 仍然成功
      const offline = async () => { throw new TypeError('Failed to fetch'); };
      await expect(
        loadPdfFonts({ force: true, fetchImpl: offline, timeoutMs: 200, bases: ['/fonts/'] })
      ).resolves.toEqual(first);
    });

    it('Cache Storage 不可用（隐私模式）时不影响导出', async () => {
      Object.defineProperty(global, 'caches', { value: undefined, configurable: true });
      await expect(
        loadPdfFonts({ force: true, fetchImpl: okFetch(), timeoutMs: 200 })
      ).resolves.toEqual({ normal: expect.any(String), bold: expect.any(String) });
    });
  });

  // 核心子集（GB2312 一级字表，524KB）优先，缺字才回退全量（1.1MB）——为慢网/移动端省流量
  describe('按文本挑字体层级', () => {
    const RANGES = parseCoreRanges({ chars: 4, ranges: [[0x20, 0x7E], [0x4E00, 0x9FA5]] });

    it.each([
      ['ASCII 全在核心集', 'hello 123', true],
      ['换行/制表不算缺字', '第一行\n第二行\t结束', true],
      ['核心集里的汉字', '命运 占卜', true],
      ['区间上边界的字（U+9FA5）', '\u9fa5', true],
      ['刚出界的字（U+9FA6）', '\u9fa6', false],
      ['emoji（U+1F52E）', '🔮', false]
    ])('%s → 被覆盖：%s', (_label, text, covered) => {
      expect(findUncoveredChar(RANGES, text) === null).toBe(covered);
    });

    it('区间解析会丢掉非法项，并按区间做二分查找', () => {
      const ranges = parseCoreRanges({ ranges: [[10, 20], [30, 30], 'bad', [5, 1], null] });
      expect(ranges).toEqual([[10, 20], [30, 30]]);
      expect(isCodePointCovered(ranges, 10)).toBe(true);
      expect(isCodePointCovered(ranges, 20)).toBe(true);
      expect(isCodePointCovered(ranges, 21)).toBe(false);
      expect(isCodePointCovered(ranges, 30)).toBe(true);
      expect(isCodePointCovered(ranges, 29)).toBe(false);
    });

    it.each([
      ['全部命中核心集', '塔罗占卜 test', 'core'],
      ['有覆盖范围外的字（emoji）', '抽到宝牌 🔮', 'full']
    ])('%s → 用 %s 字体', async (_label, text, expected) => {
      const payload = new TextEncoder().encode(JSON.stringify({ ranges: [[0x20, 0x7E], [0x4E00, 0x9FA5]] }));
      const fetchImpl = async () => ({ ok: true, arrayBuffer: async () => payload.buffer });
      await expect(pickFontTier(text, { force: true, fetchImpl, timeoutMs: 200 })).resolves.toBe(expected);
    });

    it('核心覆盖索引拿不到时回退全量字体（宁可慢，不能缺字）', async () => {
      const offline = async () => { throw new TypeError('offline'); };
      await expect(
        pickFontTier('任意文本', { force: true, fetchImpl: offline, timeoutMs: 50, bases: ['/fonts/'] })
      ).resolves.toBe('full');
    });
  });
});
