import { Outlet, Link } from 'react-router-dom';
import ScrollIndicator from './ScrollIndicator';
import FloatingDecorations from './FloatingDecorations';
import MysticEffects from './MysticEffects';
import LanguageToggle from './LanguageToggle';
import PoofNavLink from './common/PoofNavLink';
import { useDevice } from '../hooks/useDevice';
import { useLanguage } from '../context/LanguageContext';
import './Layout.css';

function Layout() {
  const { isMobile } = useDevice();
  const { language } = useLanguage();

  const navLabels = {
    home: language === 'zh' ? '首页' : 'Home',
    divination: language === 'zh' ? '塔罗占卜' : 'Tarot',
    cards: language === 'zh' ? '塔罗牌库' : 'Cards',
    ziwei: language === 'zh' ? '紫微星盘' : 'Ziwei',
    astrology: language === 'zh' ? '西方星盘' : 'Astrology',
    statistics: language === 'zh' ? '统计' : 'Stats',
    profile: language === 'zh' ? '我的' : 'Profile'
  };

  return (
    <div className="layout">
      <MysticEffects />
      {!isMobile && <FloatingDecorations position="all" />}
      {!isMobile && (
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <LanguageToggle />
              <Link to="/" className="logo">
                <span className="logo-icon">🔮</span>
                <span className="logo-text">TarotQA</span>
              </Link>
            </div>
            <nav className="nav">
              <PoofNavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                {navLabels.home}
              </PoofNavLink>
              <PoofNavLink to="/divination" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                {navLabels.divination}
              </PoofNavLink>
              <PoofNavLink to="/cards" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                {navLabels.cards}
              </PoofNavLink>
              <PoofNavLink to="/ziwei/chart" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                {navLabels.ziwei}
              </PoofNavLink>
              <PoofNavLink to="/astrology/chart" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                {navLabels.astrology}
              </PoofNavLink>
              <PoofNavLink to="/statistics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                {navLabels.statistics}
              </PoofNavLink>
              <PoofNavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                {navLabels.profile}
              </PoofNavLink>
            </nav>
          </div>
        </header>
      )}
      <main className="main">
        <Outlet />
        <div className="page-disclaimer">
          <p>
            {language === 'zh'
              ? '本平台所有占卜、命盘、星盘结果仅供参考娱乐，不构成任何决策建议。命运掌握在自己手中，请理性看待。'
              : 'All divination, horoscope, and astrological results on this platform are for entertainment purposes only and do not constitute any decision-making advice. Destiny is in your own hands, please view these results rationally.'}
          </p>
        </div>
      </main>
      <footer className="footer">
        <p>
          {language === 'zh'
            ? `© 2026 TarotQA - 塔罗占卜 v${__APP_VERSION__ || '1.0.0'} (${__GIT_SHA__?.slice(0, 8) || 'local'})`
            : `© 2026 TarotQA - Tarot Divination v${__APP_VERSION__ || '1.0.0'} (${__GIT_SHA__?.slice(0, 8) || 'local'})`}
        </p>
      </footer>
      {isMobile && <LanguageToggle />}
      <nav className="mobile-nav">
        <PoofNavLink to="/" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">{navLabels.home}</span>
        </PoofNavLink>
        <PoofNavLink to="/divination" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
          <span className="nav-icon">🔮</span>
          <span className="nav-label">{navLabels.divination}</span>
        </PoofNavLink>
        <PoofNavLink to="/cards" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
          <span className="nav-icon">🃏</span>
          <span className="nav-label">{navLabels.cards}</span>
        </PoofNavLink>
        <PoofNavLink to="/ziwei/chart" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
          <span className="nav-icon">🀄</span>
          <span className="nav-label">{navLabels.ziwei}</span>
        </PoofNavLink>
        <PoofNavLink to="/astrology/chart" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
          <span className="nav-icon">⭐</span>
          <span className="nav-label">{navLabels.astrology}</span>
        </PoofNavLink>
        <PoofNavLink to="/statistics" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
          <span className="nav-icon">📊</span>
          <span className="nav-label">{navLabels.statistics}</span>
        </PoofNavLink>
        <PoofNavLink to="/profile" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
          <span className="nav-icon">👤</span>
          <span className="nav-label">{navLabels.profile}</span>
        </PoofNavLink>
      </nav>
      <ScrollIndicator />
    </div>
  );
}

export default Layout;