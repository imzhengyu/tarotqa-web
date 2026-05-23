import { useLanguage } from '../context/LanguageContext';
import './LanguageToggle.css';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      className="language-toggle"
      onClick={toggleLanguage}
      title={language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <span className={`lang-btn ${language === 'zh' ? 'active' : ''}`}>
        中
      </span>
      <span className="lang-divider">/</span>
      <span className={`lang-btn ${language === 'en' ? 'active' : ''}`}>
        EN
      </span>
    </button>
  );
}

export default LanguageToggle;
