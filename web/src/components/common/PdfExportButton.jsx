import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLanguage } from '../../context/LanguageContext';
import Icon from './Icons';
import {
  buildPdfBlob,
  canSharePdf,
  downloadPdfBlob,
  isIosDevice,
  normalizeFileName,
  preloadPdfFonts,
  releasePdfUrl,
  sharePdfBlob
} from '../../utils/exportPdf';
import './PdfExportButton.css';

/**
 * 「导出 PDF」按钮（塔罗 / 紫微 / 星盘共用）。
 *
 * 为什么不是点一下就直接下载：真机上（尤其 iOS Safari）在若干次 await 之后再程序化点击
 * 锚点已经不属于用户手势，浏览器会静默忽略，表现就是"点了没反应"。
 * 所以这里先生成 Blob，再让用户当场点「保存 / 分享」：
 *   - 支持系统分享（iOS/Android）→ 走 navigator.share，能直接"存储到文件"；
 *   - 不支持 → 自动锚点下载 + 始终显示一个手工保存链接兜底；
 *   - 失败 → 明确显示原因，并允许重试（旧实现是静默失败）。
 */
function PdfExportButton({
  markdown,
  filename,
  meta,
  className = 'btn btn-secondary export-ai-btn',
  label
}) {
  const { t } = useLanguage();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const pdfRef = useRef({ blob: null, fileName: '', url: '', shareable: false });

  const clearPdf = useCallback(() => {
    releasePdfUrl(pdfRef.current.url);
    pdfRef.current = { blob: null, fileName: '', url: '', shareable: false };
  }, []);

  useEffect(() => clearPdf, [clearPdf]);

  // AI 结果一出来就后台预下载字体（约 5MB）：把慢网等待提前到用户点导出之前
  useEffect(() => {
    if (markdown) preloadPdfFonts();
  }, [markdown]);

  // 生成期间显示秒数：慢网下用户能看出"还在跑"，而不是以为卡死了
  useEffect(() => {
    if (status !== 'working') return undefined;
    const startedAt = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [status]);

  const generate = async () => {
    setStatus('working');
    setError('');
    clearPdf();
    try {
      const blob = await buildPdfBlob(markdown, meta);
      const fileName = normalizeFileName(filename);
      // iOS 的锚点下载经常被静默忽略 → 让它走系统分享面板（用户当场点一下，存到"文件"）
      // 桌面 / Android Chrome 的锚点下载是可靠的 → 直接下载，同时给手工兜底入口
      const share = canSharePdf(blob, fileName);
      pdfRef.current = { blob, fileName, url: '', shareable: share };
      if (share && isIosDevice()) {
        setStatus('ready-share');
      } else {
        pdfRef.current.url = downloadPdfBlob(blob, fileName);
        pdfRef.current.shareable = share;
        setStatus('ready-download');
      }
    } catch (exportError) {
      setStatus('error');
      setError(exportError?.message || String(exportError));
    }
  };

  // 用户手势内的保存：优先系统分享，失败再退回锚点下载
  const save = async () => {
    const { blob, fileName } = pdfRef.current;
    if (!blob) return;
    const result = await sharePdfBlob(blob, fileName, meta?.title);
    if (result === 'failed') {
      pdfRef.current.url = downloadPdfBlob(blob, fileName);
      setStatus('ready-download');
    }
  };

  const text = label || t('导出 PDF', 'Export as PDF');

  if (status === 'working') {
    return (
      <div className="pdf-export-wrap" data-testid="pdf-working">
        <button type="button" className={className} disabled>
          <Icon name="download" size={16} /> {t('正在生成 PDF…', 'Generating PDF…')} {elapsed}s
        </button>
        <p className="pdf-export-hint">
          {elapsed < 6
            ? t('首次导出需下载中文字体（约 5MB），稍等片刻。', 'First export downloads the CJK font (~5MB), please wait.')
            : t('网络较慢或字体下载受阻，超过 20 秒会自动报错并可重试。', 'Slow network — it will fail with a retry option after 20s.')}
        </p>
      </div>
    );
  }

  if (status === 'ready-share') {
    return (
      <div className="pdf-export-wrap" data-testid="pdf-ready-share">
        <button type="button" className={className} onClick={save}>
          <Icon name="download" size={16} /> {t('保存 / 分享 PDF', 'Save / Share PDF')}
        </button>
        <p className="pdf-export-hint">
          {t('已生成，点上面的按钮即可存储到手机。', 'Ready — tap the button above to save it to your phone.')}
        </p>
      </div>
    );
  }

  if (status === 'ready-download') {
    return (
      <div className="pdf-export-wrap" data-testid="pdf-ready-download">
        <a className={`${className} pdf-export-link`} href={pdfRef.current.url} download={pdfRef.current.fileName}>
          <Icon name="download" size={16} /> {t('保存 PDF', 'Save PDF')}
        </a>
        <p className="pdf-export-hint">
          {t('已生成，若浏览器没有自动下载，点上面的链接保存。', 'Ready — tap the link above if the download did not start.')}
        </p>
        {pdfRef.current.shareable && (
          // Android 在部分内置浏览器里会拦下载，留一个系统分享的出口
          <button type="button" className="pdf-export-share" onClick={save}>
            {t('改用分享保存', 'Save via share sheet')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="pdf-export-wrap">
      <button
        type="button"
        className={className}
        onClick={generate}
        title={text}
      >
        <Icon name="download" size={16} /> {status === 'error' ? t('重试导出 PDF', 'Retry PDF export') : text}
      </button>
      {status === 'error' && (
        <p className="pdf-export-error" role="alert">
          {t('导出失败：', 'Export failed: ')}{error}
        </p>
      )}
    </div>
  );
}

PdfExportButton.propTypes = {
  markdown: PropTypes.string,
  filename: PropTypes.string,
  meta: PropTypes.object,
  className: PropTypes.string,
  label: PropTypes.string
};

export default PdfExportButton;
