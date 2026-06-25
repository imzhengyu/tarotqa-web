import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MarkdownSection from '../../components/common/MarkdownSection';

describe('MarkdownSection', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return fallback when content is empty', () => {
    render(<MarkdownSection content="" fallback={<div>No content</div>} />);
    expect(screen.getByText('No content')).toBeInTheDocument();
  });

  it('should return null fallback by default when content is empty', () => {
    const { container } = render(<MarkdownSection content="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should show raw content while loading', () => {
    render(<MarkdownSection content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('should render markdown body after loading', async () => {
    render(<MarkdownSection content="Hello world" />);

    await waitFor(() => {
      expect(document.querySelector('.markdown-body')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should render markdown content as HTML', async () => {
    render(<MarkdownSection content="# Title" />);

    await waitFor(() => {
      const body = document.querySelector('.markdown-body');
      expect(body).toBeInTheDocument();
      expect(body.innerHTML).toContain('Title');
    }, { timeout: 3000 });
  });

  it('should handle render errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.doMock('markdown-it', () => ({
      default: vi.fn(() => ({
        render: vi.fn(() => { throw new Error('render error'); })
      }))
    }));

    const { default: MockedMarkdownSection } = await import('../../components/common/MarkdownSection');
    render(<MockedMarkdownSection content="Test" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    }, { timeout: 3000 });

    consoleSpy.mockRestore();
  });
});
