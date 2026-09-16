import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useBackToTop } from '../hooks/useBackToTop';
import Icon from '../components/common/Icons';
import './Profile.css';

/**
 * 「我的」页面：只保留真正可用的功能——DeepSeek API Key 管理与统计入口。
 * 原手机号验证码登录是 mock（demo-token + getMe 恒返回 null），后端不存在，
 * 已随 ISSUES.md 一并移除，避免给用户一个永远登录不上的入口。
 */
function Profile() {
  const { t } = useLanguage();
  const [deepseekKey, setMinimaxKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [usingDefaultKey, setUsingDefaultKey] = useState(false);
  const [message, setMessage] = useState('');
  const { showBackToTop, scrollToTop } = useBackToTop();

  useEffect(() => {
    const savedMinimaxKey = localStorage.getItem('deepseek_api_key');
    if (savedMinimaxKey) {
      setMinimaxKey(savedMinimaxKey);
    }
    if (!savedMinimaxKey && import.meta.env.VITE_DEFAULT_API_KEY) {
      setUsingDefaultKey(true);
    }
  }, []);

  const saveApiKey = () => {
    if (deepseekKey.trim()) {
      localStorage.setItem('deepseek_api_key', deepseekKey.trim());
      setMessage(t('API Key 保存成功', 'API Key saved successfully'));
      setUsingDefaultKey(false);
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('deepseek_api_key');
    setMinimaxKey('');

    if (import.meta.env.VITE_DEFAULT_API_KEY) {
      setUsingDefaultKey(true);
      setMessage(t('已切换到默认 API', 'Switched to default API'));
    } else {
      setUsingDefaultKey(false);
      setMessage(t('API Key 已清除', 'API Key cleared'));
    }
  };

  return (
    <div className="profile">
      <h1 className="page-title">{t('我的', 'Profile')}</h1>

      <div className="api-settings-card">
        <h2>{t('API 设置', 'API Settings')}</h2>

        {usingDefaultKey && (
          <div className="default-key-indicator">
            <span className="default-key-icon"><Icon name="sparkle" size={18} /></span>
            <span>{t('正在使用默认 DeepSeek API Key，可直接使用 AI 深度解读功能', 'Using default DeepSeek API Key, AI features available')}</span>
          </div>
        )}

        <div className="api-key-form">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder={t('输入 DeepSeek API Key', 'Enter DeepSeek API Key')}
            value={deepseekKey}
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
          <>{t('API Key 获取地址：', 'Get API Key: ')}<a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">platform.deepseek.com</a></>
        </p>

        <p className="api-key-hint">
          {t(
            'API Key 仅保存在本机浏览器的 localStorage，不会上传到任何服务器。',
            'The API Key is stored only in this browser\'s localStorage and is never uploaded.'
          )}
        </p>

        <div className="stats-link">
          <Link to="/statistics" className="btn btn-secondary">
            <Icon name="stats" size={16} /> {t('查看访问统计', 'View Statistics')}
          </Link>
        </div>
      </div>

      {message && <p className="profile-message">{message}</p>}

      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title={t('回到顶部', 'Back to Top')} data-tooltip={t('回到顶部', 'Back to Top')}>
          <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10.5v10.5h14V10.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

export default Profile;
