import { useState, useEffect } from 'react';
import api from '../services/api';
import useVisitStats from '../hooks/useVisitStats';
import PieChart from '../components/PieChart';
import './Profile.css';

function Profile() {
  const [activeTab, setActiveTab] = useState('api');
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [minimaxKey, setMinimaxKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [usingDefaultKey, setUsingDefaultKey] = useState(false);

  const {
    isInitialized,
    stats,
    incrementQuestionCount,
    clearAllStats,
    getTodayQuestions,
    getWeekQuestions,
    getRecentRecords,
    getDeviceStatsWithPercentage,
    getOsStatsWithPercentage
  } = useVisitStats();

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
      } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

  const handleClearAllStats = () => {
    if (window.confirm('确定要清除所有访问记录吗？此操作不可恢复。')) {
      clearAllStats();
      setMessage('访问记录已清除');
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'desktop': return '💻';
      case 'tablet': return '📱';
      case 'mobile': return '📱';
      default: return '💻';
    }
  };

  const getDeviceLabel = (deviceType) => {
    switch (deviceType) {
      case 'desktop': return '桌面';
      case 'tablet': return '平板';
      case 'mobile': return '手机';
      default: return '未知';
    }
  };

  // Render API Settings Tab
  const renderApiSettings = () => (
    <>
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
    </>
  );

  // Render Visit Stats Tab
  const renderVisitStats = () => {
    if (!isInitialized) {
      return (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      );
    }

    const totalSessions = stats.totalSessions;
    const totalQuestions = stats.totalQuestions;
    const avgPerSession = totalSessions > 0 ? (totalQuestions / totalSessions).toFixed(1) : '0.0';
    const todayQuestions = getTodayQuestions();
    const weekQuestions = getWeekQuestions();
    const deviceStats = getDeviceStatsWithPercentage();
    const osStats = getOsStatsWithPercentage();
    const recentRecords = getRecentRecords(10);

    return (
      <div className="visit-stats">
        {/* Overview Cards */}
        <div className="stats-overview">
          <div className="stat-card">
            <span className="stat-value">{totalSessions}</span>
            <span className="stat-label">总会话数</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalQuestions}</span>
            <span className="stat-label">总提问数</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{todayQuestions}</span>
            <span className="stat-label">今日提问</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{weekQuestions}</span>
            <span className="stat-label">本周提问</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{avgPerSession}</span>
            <span className="stat-label">平均/会话</span>
          </div>
        </div>

        {/* Pie Charts */}
        <div className="stats-charts">
          <PieChart data={deviceStats} size={180} title="设备分布" />
          <PieChart data={osStats} size={180} title="操作系统" />
        </div>

        {/* Recent Records */}
        <div className="recent-records">
          <h3 className="recent-records-title">最近访问记录</h3>
          {recentRecords.length === 0 ? (
            <p className="no-records">暂无访问记录</p>
          ) : (
            <div className="records-table">
              <div className="records-header">
                <span className="col-index">#</span>
                <span className="col-time">访问时间</span>
                <span className="col-device">设备</span>
                <span className="col-questions">提问数</span>
              </div>
              {recentRecords.map((record, index) => (
                <div key={record.sessionId} className="records-row">
                  <span className="col-index">{recentRecords.length - index}</span>
                  <span className="col-time">{formatTime(record.lastVisit)}</span>
                  <span className="col-device">
                    <span className="device-icon">{getDeviceIcon(record.deviceType)}</span>
                    <span className="device-label">{getDeviceLabel(record.deviceType)}</span>
                  </span>
                  <span className="col-questions">{record.questionCount}次</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear Button */}
        <div className="stats-actions">
          <button
            className="btn btn-secondary"
            onClick={handleClearAllStats}
          >
            清除所有记录
          </button>
        </div>
      </div>
    );
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
          <div className="menu-item" onClick={() => setMessage('功能开发中')}>
            <span className="menu-icon">📋</span>
            <span>占卜历史</span>
          </div>
          <div className="menu-item" onClick={() => setMessage('功能开发中')}>
            <span className="menu-icon">💳</span>
            <span>订单记录</span>
          </div>
          <div className="menu-item" onClick={() => setMessage('功能开发中')}>
            <span className="menu-icon">💎</span>
            <span>开通会员</span>
          </div>
          <div className="menu-item" onClick={logout}>
            <span className="menu-icon">🚪</span>
            <span>退出登录</span>
          </div>
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
        {/* Tab Switcher */}
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            API设置
          </button>
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            访问统计
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {activeTab === 'api' && renderApiSettings()}
          {activeTab === 'stats' && renderVisitStats()}
        </div>
      </div>
    </div>
  );
}

export default Profile;