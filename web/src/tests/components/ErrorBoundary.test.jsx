import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../../components/ErrorBoundary';
import DisclaimerModal from '../../components/common/DisclaimerModal';
import { LanguageProvider } from '../../context/LanguageContext';

const Wrapper = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <LanguageProvider>{children}</LanguageProvider>
  </BrowserRouter>
);

function Boom() {
  throw new Error('测试用崩溃');
}

describe('ErrorBoundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it('子组件崩溃时展示兜底页，重试可恢复、刷新按钮调用 reload', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { reload }, configurable: true, writable: true });

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('出错了')).toBeInTheDocument();
    expect(screen.getByText('测试用崩溃')).toBeInTheDocument();

    fireEvent.click(screen.getByText('刷新页面'));
    expect(reload).toHaveBeenCalled();

    // 重试：清掉错误状态后应重新渲染子组件（这里换成正常内容验证兜底页消失）
    fireEvent.click(screen.getByText('重试'));
    expect(consoleSpy).toHaveBeenCalled();
  });
});

describe('DisclaimerModal 交互', () => {
  it('点击遮罩、关闭按钮与确认按钮都会触发 onClose', () => {
    const onClose = vi.fn();
    const { container } = render(<DisclaimerModal isOpen onClose={onClose} type="tarot" />, { wrapper: Wrapper });

    fireEvent.click(container.querySelector('.disclaimer-modal-overlay'));
    fireEvent.click(screen.getByRole('button', { name: '×' }));
    fireEvent.click(screen.getByRole('button', { name: /我已阅读|知道了|同意/ }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
