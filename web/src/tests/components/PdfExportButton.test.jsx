import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PdfExportButton from '../../components/common/PdfExportButton';
import { LanguageProvider } from '../../context/LanguageContext';

vi.mock('../../utils/exportPdf', () => ({
  buildPdfBlob: vi.fn(),
  canSharePdf: vi.fn(),
  downloadPdfBlob: vi.fn(() => 'blob:mock-pdf'),
  isIosDevice: vi.fn(() => false),
  normalizeFileName: vi.fn((name) => `${name || 'x'}.pdf`),
  releasePdfUrl: vi.fn(),
  sharePdfBlob: vi.fn()
}));

const Wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>;
const PDF_BLOB = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

async function setup() {
  const utils = await import('../../utils/exportPdf');
  utils.buildPdfBlob.mockResolvedValue(PDF_BLOB);
  utils.canSharePdf.mockReturnValue(false);
  utils.isIosDevice.mockReturnValue(false);
  utils.sharePdfBlob.mockResolvedValue('shared');
  return utils;
}

function renderButton() {
  render(<PdfExportButton markdown="## 解读" filename="sample" meta={{ title: 't' }} />, { wrapper: Wrapper });
  return screen.getByRole('button', { name: /导出 PDF/ });
}

describe('PdfExportButton（移动端可用的导出入口）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('点击后进入生成中状态（按钮禁用，防止重复点）', async () => {
    const utils = await setup();
    let resolveBlob;
    utils.buildPdfBlob.mockReturnValue(new Promise((resolve) => { resolveBlob = resolve; }));

    const button = renderButton();
    fireEvent.click(button);

    expect(screen.getByRole('button', { name: /正在生成 PDF/ })).toBeDisabled();
    resolveBlob(PDF_BLOB);
    await waitFor(() => expect(screen.getByTestId('pdf-ready-download')).toBeInTheDocument());
  });

  it('不支持系统分享时：自动下载 + 渲染带 download 属性的手工保存链接', async () => {
    const utils = await setup();
    utils.canSharePdf.mockReturnValue(false);

    fireEvent.click(renderButton());

    await waitFor(() => expect(screen.getByTestId('pdf-ready-download')).toBeInTheDocument());
    expect(utils.downloadPdfBlob).toHaveBeenCalledWith(PDF_BLOB, 'sample.pdf');
    const link = screen.getByRole('link', { name: /保存 PDF/ });
    expect(link).toHaveAttribute('href', 'blob:mock-pdf');
    expect(link).toHaveAttribute('download', 'sample.pdf');
  });

  it('iOS + 可分享：先让用户点一次「保存 / 分享」，这一下才在手势里调 share（不依赖异步后的程序化点击）', async () => {
    const utils = await setup();
    utils.canSharePdf.mockReturnValue(true);
    utils.isIosDevice.mockReturnValue(true);

    fireEvent.click(renderButton());

    await waitFor(() => expect(screen.getByTestId('pdf-ready-share')).toBeInTheDocument());
    expect(utils.downloadPdfBlob).not.toHaveBeenCalled(); // 不再依赖"异步后的程序化点击"

    fireEvent.click(screen.getByRole('button', { name: /保存 \/ 分享 PDF/ }));
    await waitFor(() => expect(utils.sharePdfBlob).toHaveBeenCalledWith(PDF_BLOB, 'sample.pdf', 't'));
    expect(screen.getByTestId('pdf-ready-share')).toBeInTheDocument();
  });

  it('Android + 可分享：仍然直接下载，同时多给一个「改用分享保存」出口', async () => {
    const utils = await setup();
    utils.canSharePdf.mockReturnValue(true);
    utils.isIosDevice.mockReturnValue(false);

    fireEvent.click(renderButton());

    await waitFor(() => expect(screen.getByTestId('pdf-ready-download')).toBeInTheDocument());
    expect(utils.downloadPdfBlob).toHaveBeenCalledWith(PDF_BLOB, 'sample.pdf');
    fireEvent.click(screen.getByRole('button', { name: /改用分享保存/ }));
    await waitFor(() => expect(utils.sharePdfBlob).toHaveBeenCalledWith(PDF_BLOB, 'sample.pdf', 't'));
  });

  it('分享失败时退回锚点下载并给出保存链接（不再静默失败）', async () => {
    const utils = await setup();
    utils.canSharePdf.mockReturnValue(true);
    utils.isIosDevice.mockReturnValue(true);
    utils.sharePdfBlob.mockResolvedValue('failed');

    fireEvent.click(renderButton());
    await waitFor(() => expect(screen.getByTestId('pdf-ready-share')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /保存 \/ 分享 PDF/ }));

    await waitFor(() => expect(screen.getByTestId('pdf-ready-download')).toBeInTheDocument());
    expect(utils.downloadPdfBlob).toHaveBeenCalledWith(PDF_BLOB, 'sample.pdf');
  });

  it('生成失败时用 role=alert 显示原因，按钮变「重试导出 PDF」', async () => {
    const utils = await setup();
    utils.buildPdfBlob.mockRejectedValue(new Error('字体加载失败：noto-sans-sc-400.ttf（404）'));

    fireEvent.click(renderButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('导出失败：');
    expect(alert).toHaveTextContent('字体加载失败：noto-sans-sc-400.ttf（404）');
    expect(screen.getByRole('button', { name: /重试导出 PDF/ })).toBeEnabled();
  });
});
