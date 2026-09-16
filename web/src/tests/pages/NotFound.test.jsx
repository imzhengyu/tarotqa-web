import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '../../pages/NotFound';
import { LanguageProvider } from '../../context/LanguageContext';

const TestWrapper = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <LanguageProvider>{children}</LanguageProvider>
  </BrowserRouter>
);

describe('NotFound', () => {
  it('应该渲染 404 文案与返回首页链接', () => {
    render(<NotFound />, { wrapper: TestWrapper });

    expect(screen.getByText('页面不存在')).toBeInTheDocument();
    expect(screen.getByText('返回首页')).toHaveAttribute('href', '/');
  });
});
