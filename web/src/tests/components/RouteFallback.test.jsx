import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RouteFallback from '../../components/RouteFallback';
import { LanguageProvider } from '../../context/LanguageContext';

const TestWrapper = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('RouteFallback', () => {
  it('should render loading text in Chinese by default', () => {
    render(<RouteFallback />, { wrapper: TestWrapper });
    expect(screen.getByText('加载中…')).toBeInTheDocument();
  });

  it('should render loading text in English when language is en', () => {
    localStorage.setItem('tarotqa-language', 'en');
    render(<RouteFallback />, { wrapper: TestWrapper });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('should have status role', () => {
    render(<RouteFallback />, { wrapper: TestWrapper });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have route-fallback class', () => {
    render(<RouteFallback />, { wrapper: TestWrapper });
    expect(document.querySelector('.route-fallback')).toBeInTheDocument();
  });

  it('should have pulse element', () => {
    render(<RouteFallback />, { wrapper: TestWrapper });
    expect(document.querySelector('.route-fallback-pulse')).toBeInTheDocument();
  });
});
