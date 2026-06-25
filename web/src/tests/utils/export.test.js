import { describe, it, expect, vi } from 'vitest';
import { exportToPNG } from '../../utils/export';

describe('exportToPNG', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    Object.defineProperty(document, 'fonts', {
      value: { ready: Promise.resolve() },
      configurable: true
    });
  });

  it('should throw error when element is not found', async () => {
    await expect(exportToPNG('missing-element')).rejects.toThrow('导出元素未找到');
  });

  it('should call html2canvas and trigger download when element exists', async () => {
    const element = document.createElement('div');
    element.id = 'export-element';
    document.body.appendChild(element);

    const createElementSpy = vi.spyOn(document, 'createElement');

    await exportToPNG('export-element', 'test-export');

    expect(createElementSpy).toHaveBeenCalledWith('a');
  });

  it('should use default filename when not provided', async () => {
    const element = document.createElement('div');
    element.id = 'export-element-default';
    document.body.appendChild(element);

    const createElementSpy = vi.spyOn(document, 'createElement');

    await exportToPNG('export-element-default');

    const link = createElementSpy.mock.results.find(r => r.value.tagName === 'A')?.value;
    expect(link.download).toBe('export.png');
  });

  it('should use provided filename', async () => {
    const element = document.createElement('div');
    element.id = 'export-element-named';
    document.body.appendChild(element);

    const createElementSpy = vi.spyOn(document, 'createElement');

    await exportToPNG('export-element-named', 'my-report');

    const link = createElementSpy.mock.results.find(r => r.value.tagName === 'A')?.value;
    expect(link.download).toBe('my-report.png');
  });
});
