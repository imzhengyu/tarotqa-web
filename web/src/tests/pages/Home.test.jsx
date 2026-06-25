import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../pages/Home';
import { LanguageProvider } from '../../context/LanguageContext';

vi.mock('../../hooks/useBackToTop', () => ({
  useBackToTop: vi.fn(() => ({ showBackToTop: false, scrollToTop: vi.fn() }))
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <LanguageProvider>{children}</LanguageProvider>
  </BrowserRouter>
);

describe('Home', () => {
  it('should render tarot section', () => {
    render(<Home />, { wrapper: TestWrapper });
    expect(screen.getByText('塔罗占卜')).toBeInTheDocument();
  });

  it('should render ziwei section', () => {
    render(<Home />, { wrapper: TestWrapper });
    expect(screen.getByText('紫微斗数')).toBeInTheDocument();
  });

  it('should render astrology section', () => {
    render(<Home />, { wrapper: TestWrapper });
    expect(screen.getByText('十二宫星盘')).toBeInTheDocument();
  });

  it('should render navigation links', () => {
    render(<Home />, { wrapper: TestWrapper });
    expect(screen.getByText('开始占卜').closest('a').getAttribute('href')).toBe('/divination');
    const generateLinks = screen.getAllByText('立即排盘');
    expect(generateLinks.length).toBe(2);
    expect(generateLinks[0].closest('a').getAttribute('href')).toBe('/ziwei/chart');
    expect(generateLinks[1].closest('a').getAttribute('href')).toBe('/astrology/chart');
  });
});
