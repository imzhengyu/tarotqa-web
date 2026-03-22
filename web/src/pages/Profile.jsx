import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [minimaxKey, setMinimaxKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [usingDefaultKey, setUsingDefaultKey] = useState(false);

  useEffect(() => {
    checkLogin();
    const savedKey = localStorage.getItem('minimax_api_key');
    if (savedKey) {
      setMinimaxKey(savedKey);
      setUsingDefaultKey(false);
    } else if (import.meta.env.VITE_DEFAULT_API_KEY) {
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
      setMessage('请输入有效手机号');
      return;
    }
    setLoading(true);
    try {
      await api.sendCode(phone);
      setCodeSent(true);
      setMessage('验证码已发送');
    } catch {
      setMessage('发送失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    if (!code || code.length !== 6) {
      setMessage('请输入6位验证码');
      return;
    }
    setLoading(true);
    try {
      const result = await api.verifyCode(phone, code);
      localStorage.setItem('token', result.token);
      setUser(result.user);
      setMessage('登录成功');
    } catch {
      setMessage('验证失败');
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

  const saveMinimaxKey = () => {
    if (minimaxKey.trim()) {
      localStorage.setItem('minimax_api_key', minimaxKey.trim());
      setMessage('API Key 保存成功');
      setUsingDefaultKey(false);
    }
  };

  const clearMinimaxKey = () => {
    localStorage.removeItem('minimax_api_key');
    setMinimaxKey('');
    if (import.meta.env.VITE_DEFAULT_API_KEY) {
      setUsingDefaultKey(true);
      setMessage('已切换到默认 API');
    } else {
      setUsingDefaultKey(false);
      setMessage('API Key 已清除');
    }
  };

if (user) {
    return (
      <div className="profile">
        <h1 className="page-title">我的</h1>

        <div className="profile-card">
          <div className="profile-avatar">
            <span>👤</span>
          </div>
          <div className="profile-info">
            <p className="profile-phone">{user.phone || '微信用户'}</p>
            <p className="profile-level">
              {user.memberLevel === 'free' ? '免费用户' : 'VIP会员'}
            </p>
          </div>
        </div>

        <div className="profile-menu">
          <button className="menu-item" onClick={() => setMessage('功能开发中')}>
            <span className="menu-icon">📋</span>
            <span>占卜历史</span>
          </button>
          <button className="menu-item" onClick={() => setMessage('功能开发中')}>
            <span className="menu-icon">💳</span>
            <span>订单记录</span>
          </button>
          <button className="menu-item" onClick={() => setMessage('功能开发中')}>
            <span className="menu-icon">💎</span>
            <span>开通会员</span>
          </button>
          <button className="menu-item" onClick={logout}>
            <span className="menu-icon">🚪</span>
            <span>退出登录</span>
          </button>
        </div>

        {message && <p className="profile-message">{message}</p>}
      </div>
    );
  }

  return (
    <div className="profile">
      <h1 className="page-title">我的</h1>

      <div className="login-card">
        <h2>手机号登录</h2>
        <p className="login-desc">请输入您的手机号获取验证码</p>

        <div className="login-form">
          <input
            type="tel"
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={11}
          />

          {!codeSent ? (
            <button
              className="btn btn-secondary"
              onClick={sendCode}
              disabled={loading}
            >
              {loading ? '发送中...' : '获取验证码'}
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="请输入验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
              <button
                className="btn btn-primary"
                onClick={login}
                disabled={loading}
              >
                {loading ? '验证中...' : '登录'}
              </button>
            </>
          )}
        </div>

        {message && <p className="login-message">{message}</p>}
      </div>

      <div className="api-settings-card">
        <h2>API 设置</h2>

        {usingDefaultKey && (
          <div className="default-key-indicator">
            <span className="default-key-icon">✨</span>
            <span>正在使用默认 API Key，可直接使用 AI 深度解读功能</span>
          </div>
        )}

        <div className="api-key-form">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="输入 MiniMax API Key"
            value={minimaxKey}
            onChange={(e) => setMinimaxKey(e.target.value)}
          />
          <button
            className="btn btn-secondary"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? '隐藏' : '显示'}
          </button>
        </div>

        <div className="api-key-actions">
          <button
            className="btn btn-primary"
            onClick={saveMinimaxKey}
          >
            保存
          </button>
          <button
            className="btn btn-secondary"
            onClick={clearMinimaxKey}
          >
            清除
          </button>
        </div>

        <p className="api-key-hint">
          API Key 获取地址：<a href="https://platform.minimaxi.com" target="_blank" rel="noopener noreferrer">platform.minimaxi.com</a>
        </p>

        <div className="stats-link">
          <Link to="/statistics" className="btn btn-secondary">
            📊 查看访问统计
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Profile;