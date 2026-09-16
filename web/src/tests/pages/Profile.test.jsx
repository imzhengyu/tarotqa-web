import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../../pages/Profile';
import { LanguageProvider } from '../../context/LanguageContext';

vi.mock('../../hooks/useBackToTop', () => ({
  useBackToTop: vi.fn(() => ({ showBackToTop: false, scrollToTop: vi.fn() }))
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <LanguageProvider>{children}</LanguageProvider>
  </BrowserRouter>
);

describe('Profile', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // 回归：原来的手机号验证码登录是 mock（demo-token），点了永远登录不上，
  // 现在「我的」只保留真实可用的 API Key 管理与统计入口。
  it('不再渲染假的手机号登录表单', () => {
    render(<Profile />, { wrapper: TestWrapper });

    expect(screen.queryByText('手机号登录')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('请输入手机号')).not.toBeInTheDocument();
    expect(screen.getByText('API 设置')).toBeInTheDocument();
  });

  it('应该保存 API key', () => {
    render(<Profile />, { wrapper: TestWrapper });
    const keyInput = screen.getByPlaceholderText('输入 DeepSeek API Key');
    fireEvent.change(keyInput, { target: { value: 'my-api-key' } });
    fireEvent.click(screen.getByText('保存'));

    expect(localStorage.getItem('deepseek_api_key')).toBe('my-api-key');
    expect(screen.getByText('API Key 保存成功')).toBeInTheDocument();
  });

  it('应该在无默认 key 时清除 API key', () => {
    localStorage.setItem('deepseek_api_key', 'my-api-key');
    render(<Profile />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByText('清除'));

    expect(localStorage.getItem('deepseek_api_key')).toBeNull();
    expect(screen.getByText('API Key 已清除')).toBeInTheDocument();
  });

  it('应该在存在默认 key 时回退到默认 API', () => {
    vi.stubEnv('VITE_DEFAULT_API_KEY', 'default-key');
    localStorage.setItem('deepseek_api_key', 'my-api-key');

    render(<Profile />, { wrapper: TestWrapper });
    fireEvent.click(screen.getByText('清除'));

    expect(screen.getByText('已切换到默认 API')).toBeInTheDocument();
  });

  it('应该切换 API key 的显示/隐藏', () => {
    render(<Profile />, { wrapper: TestWrapper });
    const keyInput = screen.getByPlaceholderText('输入 DeepSeek API Key');
    expect(keyInput.getAttribute('type')).toBe('password');

    fireEvent.click(screen.getByText('显示'));
    expect(keyInput.getAttribute('type')).toBe('text');

    fireEvent.click(screen.getByText('隐藏'));
    expect(keyInput.getAttribute('type')).toBe('password');
  });

  it('应该在挂载时提示正在使用默认 key，并读取已保存的 key', () => {
    vi.stubEnv('VITE_DEFAULT_API_KEY', 'default-key');
    render(<Profile />, { wrapper: TestWrapper });
    expect(screen.getByText(/正在使用默认 DeepSeek API Key/)).toBeInTheDocument();
  });

  it('应该读取已保存的 API key 并说明只存本地', () => {
    localStorage.setItem('deepseek_api_key', 'saved-key');
    render(<Profile />, { wrapper: TestWrapper });

    expect(screen.getByPlaceholderText('输入 DeepSeek API Key').value).toBe('saved-key');
    expect(screen.getByText(/仅保存在本机浏览器的 localStorage/)).toBeInTheDocument();
  });

  it('应该提供访问统计入口', () => {
    render(<Profile />, { wrapper: TestWrapper });
    expect(screen.getByText(/查看访问统计/)).toHaveAttribute('href', '/statistics');
  });
});
