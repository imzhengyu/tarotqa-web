import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../../pages/Profile';
import { LanguageProvider } from '../../context/LanguageContext';
import api from '../../services/api';

const mockUser = {
  phone: '13800138000',
  memberLevel: 'free'
};

vi.mock('../../services/api', () => ({
  default: {
    getMe: vi.fn(),
    sendCode: vi.fn(),
    verifyCode: vi.fn()
  }
}));

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
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should render login form when not logged in', () => {
    render(<Profile />, { wrapper: TestWrapper });
    expect(screen.getByText('手机号登录')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
    expect(screen.getByText('获取验证码')).toBeInTheDocument();
  });

  it('should show message when phone is invalid', () => {
    render(<Profile />, { wrapper: TestWrapper });
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '123' } });
    fireEvent.click(screen.getByText('获取验证码'));
    expect(screen.getByText('请输入有效手机号')).toBeInTheDocument();
  });

  it('should send verification code successfully', async () => {
    api.sendCode.mockResolvedValueOnce();
    render(<Profile />, { wrapper: TestWrapper });

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('获取验证码'));

    await waitFor(() => {
      expect(api.sendCode).toHaveBeenCalledWith('13800138000');
      expect(screen.getByText('验证码已发送')).toBeInTheDocument();
    });
  });

  it('should show error when send code fails', async () => {
    api.sendCode.mockRejectedValueOnce(new Error('send failed'));
    render(<Profile />, { wrapper: TestWrapper });

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('获取验证码'));

    await waitFor(() => {
      expect(screen.getByText('发送失败，请重试')).toBeInTheDocument();
    });
  });

  it('should login successfully with valid code', async () => {
    api.sendCode.mockResolvedValueOnce();
    api.verifyCode.mockResolvedValueOnce({ token: 'abc123', user: mockUser });
    render(<Profile />, { wrapper: TestWrapper });

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('获取验证码'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
    });

    const codeInput = screen.getByPlaceholderText('请输入验证码');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('登录'));

    await waitFor(() => {
      expect(api.verifyCode).toHaveBeenCalledWith('13800138000', '123456');
      expect(screen.getByText('登录成功')).toBeInTheDocument();
      expect(screen.getByText('13800138000')).toBeInTheDocument();
    });
  });

  it('should show error when verification fails', async () => {
    api.sendCode.mockResolvedValueOnce();
    api.verifyCode.mockRejectedValueOnce(new Error('verify failed'));
    render(<Profile />, { wrapper: TestWrapper });

    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    fireEvent.click(screen.getByText('获取验证码'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('请输入验证码')).toBeInTheDocument();
    });

    const codeInput = screen.getByPlaceholderText('请输入验证码');
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByText('登录'));

    await waitFor(() => {
      expect(screen.getByText('验证失败')).toBeInTheDocument();
    });
  });

  it('should load user profile when token exists', async () => {
    localStorage.setItem('token', 'existing-token');
    api.getMe.mockResolvedValueOnce(mockUser);

    render(<Profile />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
      expect(screen.getByText('13800138000')).toBeInTheDocument();
      expect(screen.getByText('免费用户')).toBeInTheDocument();
    });
  });

  it('should clear token when getMe fails', async () => {
    localStorage.setItem('token', 'invalid-token');
    api.getMe.mockRejectedValueOnce(new Error('auth failed'));

    render(<Profile />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByText('手机号登录')).toBeInTheDocument();
    });
  });

  it('should logout from profile view', async () => {
    localStorage.setItem('token', 'existing-token');
    api.getMe.mockResolvedValueOnce(mockUser);

    render(<Profile />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('退出登录')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('退出登录'));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(screen.getByText('手机号登录')).toBeInTheDocument();
    });
  });

  it('should save API key', () => {
    render(<Profile />, { wrapper: TestWrapper });
    const keyInput = screen.getByPlaceholderText('输入 MiniMax API Key');
    fireEvent.change(keyInput, { target: { value: 'my-api-key' } });
    fireEvent.click(screen.getByText('保存'));

    expect(localStorage.getItem('minimax_api_key')).toBe('my-api-key');
    expect(screen.getByText('API Key 保存成功')).toBeInTheDocument();
  });

  it('should clear API key without default key', () => {
    localStorage.setItem('minimax_api_key', 'my-api-key');
    render(<Profile />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByText('清除'));

    expect(localStorage.getItem('minimax_api_key')).toBeNull();
    expect(screen.getByText('API Key 已清除')).toBeInTheDocument();
  });

  it('should clear API key and switch to default key', () => {
    vi.stubEnv('VITE_DEFAULT_API_KEY', 'default-key');
    localStorage.setItem('minimax_api_key', 'my-api-key');

    render(<Profile />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByText('清除'));

    expect(screen.getByText('已切换到默认 API')).toBeInTheDocument();
  });

  it('should toggle API key visibility', () => {
    render(<Profile />, { wrapper: TestWrapper });
    const keyInput = screen.getByPlaceholderText('输入 MiniMax API Key');
    expect(keyInput.getAttribute('type')).toBe('password');

    fireEvent.click(screen.getByText('显示'));
    expect(keyInput.getAttribute('type')).toBe('text');

    fireEvent.click(screen.getByText('隐藏'));
    expect(keyInput.getAttribute('type')).toBe('password');
  });

  it('should show default key indicator on mount', () => {
    vi.stubEnv('VITE_DEFAULT_API_KEY', 'default-key');
    render(<Profile />, { wrapper: TestWrapper });
    expect(screen.getByText(/正在使用默认 MiniMax API Key/)).toBeInTheDocument();
  });

  it('should load saved API key on mount', () => {
    localStorage.setItem('minimax_api_key', 'saved-key');
    render(<Profile />, { wrapper: TestWrapper });
    const keyInput = screen.getByPlaceholderText('输入 MiniMax API Key');
    expect(keyInput.value).toBe('saved-key');
  });
});
