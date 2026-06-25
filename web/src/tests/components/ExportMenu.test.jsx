import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportMenu from '../../components/common/ExportMenu';
import { LanguageProvider } from '../../context/LanguageContext';
import * as exportModule from '../../utils/export';

const TestWrapper = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('ExportMenu', () => {
  beforeEach(() => {
    vi.spyOn(exportModule, 'exportToPNG').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render export trigger button', () => {
    render(<ExportMenu elementId="test-element" />, { wrapper: TestWrapper });
    expect(screen.getByTitle('导出')).toBeInTheDocument();
  });

  it('should open dropdown when trigger is clicked', () => {
    render(<ExportMenu elementId="test-element" />, { wrapper: TestWrapper });
    fireEvent.click(screen.getByTitle('导出'));
    expect(screen.getByText('导出为 PNG')).toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', () => {
    render(<ExportMenu elementId="test-element" />, { wrapper: TestWrapper });
    fireEvent.click(screen.getByTitle('导出'));
    expect(screen.getByText('导出为 PNG')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('导出为 PNG')).not.toBeInTheDocument();
  });

  it('should call exportToPNG when PNG option is clicked', async () => {
    render(<ExportMenu elementId="test-element" filename="my-export" />, { wrapper: TestWrapper });
    fireEvent.click(screen.getByTitle('导出'));
    fireEvent.click(screen.getByText('导出为 PNG'));

    await waitFor(() => {
      expect(exportModule.exportToPNG).toHaveBeenCalledWith('test-element', 'my-export');
    });
  });

  it('should use default filename when not provided', async () => {
    render(<ExportMenu elementId="test-element" />, { wrapper: TestWrapper });
    fireEvent.click(screen.getByTitle('导出'));
    fireEvent.click(screen.getByText('导出为 PNG'));

    await waitFor(() => {
      expect(exportModule.exportToPNG).toHaveBeenCalledWith('test-element', 'export');
    });
  });

  it('should show alert on export error', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(exportModule, 'exportToPNG').mockRejectedValue(new Error('export failed'));

    render(<ExportMenu elementId="test-element" />, { wrapper: TestWrapper });
    fireEvent.click(screen.getByTitle('导出'));
    fireEvent.click(screen.getByText('导出为 PNG'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    });

    alertSpy.mockRestore();
  });

  it('should disable trigger while exporting', async () => {
    vi.spyOn(exportModule, 'exportToPNG').mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 50)));

    render(<ExportMenu elementId="test-element" />, { wrapper: TestWrapper });
    const trigger = screen.getByTitle('导出');
    fireEvent.click(trigger);
    fireEvent.click(screen.getByText('导出为 PNG'));

    await waitFor(() => {
      expect(trigger).toBeDisabled();
    });
  });
});
