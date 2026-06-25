import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { UI_LIMITS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { useBackToTop } from '../hooks/useBackToTop';
import './Profile.css';

function Profile() {
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [minimaxKey, setMinimaxKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [usingDefaultKey, setUsingDefaultKey] = useState(false);
  const { showBackToTop, scrollToTop } = useBackToTop();

  useEffect(() => {
    checkLogin();
    const savedMinimaxKey = localStorage.getItem('minimax_api_key');
    if (savedMinimaxKey) {
      setMinimaxKey(savedMinimaxKey);
    }
    if (!savedMinimaxKey && import.meta.env.VITE_DEFAULT_API_KEY) {
      setUsingDefaultKey(true);
    }
  }, []);

  const checkLogin = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch {
        localStorage.removeItem('token');
      }
    }
  };

  const sendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setMessage(t('请输入有效手机号', 'Please enter a valid phone number'));
      return;
    }
    setLoading(true);
    try {
      await api.sendCode(phone);
      setCodeSent(true);
      setMessage(t('验证码已发送', 'Verification code sent'));
    } catch {
      setMessage(t('发送失败，请重试', 'Failed to send, please try again'));
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (!code || code.length !== 6) {
      setMessage(t('请输入6位验证码', 'Please enter 6-digit code'));
      return;
    }
    setLoading(true);
    try {
      const result = await api.verifyCode(phone, code);
      localStorage.setItem('token', result.token);
      setUser(result.user);
      setMessage(t('登录成功', 'Login successful'));
    } catch {
      setMessage(t('验证失败', 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPhone('');
    setCode('');
    setCodeSent(false);
  };

  const saveApiKey = () => {
    if (minimaxKey.trim()) {
      localStorage.setItem('minimax_api_key', minimaxKey.trim());
      setMessage(t('API Key 保存成功', 'API Key saved successfully'));
      setUsingDefaultKey(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('minimax_api_key');
    setMinimaxKey('');

    if (import.meta.env.VITE_DEFAULT_API_KEY) {
      setUsingDefaultKey(true);
      setMessage(t('已切换到默认 API', 'Switched to default API'));
    } else {
      setUsingDefaultKey(false);
      setMessage(t('API Key 已清除', 'API Key cleared'));
    }
  };

  if (user) {
    return (
      <div className="profile">
        <h1 className="page-title">{t('我的', 'Profile')}</h1>

        <div className="profile-card">
          <div className="profile-avatar">
            <span>👤</span>
          </div>
          <div className="profile-info">
            <p className="profile-phone">{user.phone || t('微信用户', 'WeChat User')}</p>
            <p className="profile-level">
              {user.memberLevel === 'free' ? t('免费用户', 'Free User') : 'VIP'}
            </p>
          </div>
        </div>

        <div className="profile-menu">
          <button className="menu-item" onClick={() => setMessage(t('功能开发中', 'Coming soon'))}>
            <span className="menu-icon">📋</span>
            <span>{t('占卜历史', 'Divination History')}</span>
          </button>
          <button className="menu-item" onClick={() => setMessage(t('功能开发中', 'Coming soon'))}>
            <span className="menu-icon">💳</span>
            <span>{t('订单记录', 'Order History')}</span>
          </button>
          <button className="menu-item" onClick={() => setMessage(t('功能开发中', 'Coming soon'))}>
            <span className="menu-icon">💎</span>
            <span>{t('开通会员', 'Become VIP')}</span>
          </button>
          <button className="menu-item" onClick={logout}>
            <span className="menu-icon">🚪</span>
            <span>{t('退出登录', 'Logout')}</span>
          </button>
        </div>

        {message && <p className="profile-message">{message}</p>}
      </div>
    );
  }

  return (
    <div className="profile">
      <h1 className="page-title">{t('我的', 'Profile')}</h1>

      <div className="login-card">
        <h2>{t('手机号登录', 'Phone Login')}</h2>
        <p className="login-desc">{t('请输入您的手机号获取验证码', 'Enter your phone number for verification')}</p>

        <div className="login-form">
          <input
            type="tel"
            placeholder={t('请输入手机号', 'Enter phone number')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={UI_LIMITS.MAX_PHONE_LENGTH}
          />

          {!codeSent ? (
            <button
              className="btn btn-secondary"
              onClick={sendCode}
              disabled={loading}
            >
              {loading ? t('发送中...', 'Sending...') : t('获取验证码', 'Get Code')}
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder={t('请输入验证码', 'Enter verification code')}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={UI_LIMITS.MAX_VERIFICATION_CODE_LENGTH}
              />
              <button
                className="btn btn-primary"
                onClick={login}
                disabled={loading}
              >
                {loading ? t('验证中...', 'Verifying...') : t('登录', 'Login')}
              </button>
            </>
          )}
        </div>

        {message && <p className="login-message">{message}</p>}
      </div>

      <div className="api-settings-card">
        <h2>{t('API 设置', 'API Settings')}</h2>

        {usingDefaultKey && (
          <div className="default-key-indicator">
            <span className="default-key-icon">✨</span>
            <span>{t('正在使用默认 MiniMax API Key，可直接使用 AI 深度解读功能', 'Using default MiniMax API Key, AI features available')}</span>
          </div>
        )}

        <div className="api-key-form">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder={t('输入 MiniMax API Key', 'Enter MiniMax API Key')}
            value={minimaxKey}
            onChange={(e) => setMinimaxKey(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? t('隐藏', 'Hide') : t('显示', 'Show')}
          </button>
        </div>

        <div className="api-key-actions">
          <button
            className="btn btn-primary"
            onClick={saveApiKey}
          >
            {t('保存', 'Save')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={clearApiKey}
          >
            {t('清除', 'Clear')}
          </button>
        </div>

        <p className="api-key-hint">
          <>{t('API Key 获取地址：', 'Get API Key: ')}<a href="https://platform.minimaxi.com" target="_blank" rel="noopener noreferrer">platform.minimaxi.com</a></>
        </p>

        <div className="stats-link">
          <Link to="/statistics" className="btn btn-secondary">
            📊 {t('查看访问统计', 'View Statistics')}
          </Link>
        </div>
      </div>
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title={t('回到顶部', 'Back to Top')} data-tooltip={t('回到顶部', 'Back to Top')}>
          <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10.5v10.5h14V10.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

export default Profile;
