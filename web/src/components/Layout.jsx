import { Outlet, Link } from 'react-router-dom';
import ScrollIndicator from './ScrollIndicator';
import LanguageToggle from './LanguageToggle';
import PoofNavLink from './common/PoofNavLink';
import Icon from './common/Icons';
import { useDevice } from '../hooks/useDevice';
import { useLanguage } from '../context/LanguageContext';
import { commitTimeSuffix, shortSha } from '../utils/commitInfo';
import './Layout.css';

/**
 * 导航配置只写一份，桌面端与移动端共用（原来两处各写一遍，还要手写三元表达式翻译）。
 * 图标统一走 Icons.jsx 的线性 SVG，不再用 emoji。
 */
const NAV_ITEMS = [
  { to: '/', icon: 'home', label: ['首页', 'Home'] },
  { to: '/divination', icon: 'tarot', label: ['塔罗占卜', 'Tarot'] },
  { to: '/cards', icon: 'cards', label: ['塔罗牌库', 'Cards'] },
  { to: '/ziwei/chart', icon: 'ziwei', label: ['紫微星盘', 'Ziwei'] },
  { to: '/astrology/chart', icon: 'astro', label: ['西方星盘', 'Astrology'] },
  { to: '/statistics', icon: 'stats', label: ['统计', 'Stats'] },
  { to: '/profile', icon: 'user', label: ['我的', 'Profile'] }
];

function Layout() {
  const { isMobile, deviceType } = useDevice();
  const { t } = useLanguage();

  return (
    <div className={`layout layout-${deviceType}`}>
      {!isMobile && (
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <LanguageToggle />
              <Link to="/" className="logo">
                <Icon name="sparkle" size={20} className="logo-icon" />
                <span className="logo-text">TarotQA</span>
              </Link>
            </div>
            <nav className="nav">
              {NAV_ITEMS.map((item) => (
                <PoofNavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                >
                  {t(item.label[0], item.label[1])}
                </PoofNavLink>
              ))}
            </nav>
          </div>
        </header>
      )}

      <main className="main">
        <Outlet />
        <div className="page-disclaimer">
          <p>
            {t(
              '本平台所有占卜、命盘、星盘结果仅供参考娱乐，不构成任何决策建议。命运掌握在自己手中，请理性看待。',
              'All divination, horoscope, and astrological results on this platform are for entertainment purposes only and do not constitute any decision-making advice. Destiny is in your own hands, please view these results rationally.'
            )}
          </p>
        </div>
      </main>

      <footer className="footer">
        <p>
          {t(
            `© 2026 TarotQA - 塔罗占卜 v${__APP_VERSION__ || '1.0.0'} (${shortSha(__GIT_SHA__)})${commitTimeSuffix(__GIT_TIME__, 'zh')}`,
            `© 2026 TarotQA - Tarot Divination v${__APP_VERSION__ || '1.0.0'} (${shortSha(__GIT_SHA__)})${commitTimeSuffix(__GIT_TIME__, 'en')}`
          )}
        </p>
      </footer>

      {isMobile && <LanguageToggle />}

      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => (
          <PoofNavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'mobile-nav-item active' : 'mobile-nav-item')}
          >
            <Icon name={item.icon} size={20} className="nav-icon" />
            <span className="nav-label">{t(item.label[0], item.label[1])}</span>
          </PoofNavLink>
        ))}
      </nav>

      <ScrollIndicator />
    </div>
  );
}

export default Layout;
