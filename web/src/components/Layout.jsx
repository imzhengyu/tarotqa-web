import { Outlet, NavLink, Link } from 'react-router-dom';
import ScrollIndicator from './ScrollIndicator';
import { useDevice } from '../hooks/useDevice';
import './Layout.css';

function Layout() {
  const { isMobile } = useDevice();

  return (
    <div className="layout">
      {!isMobile && (
        <header className="header">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-icon">🔮</span>
              <span className="logo-text">TarotQA</span>
            </Link>
            <nav className="nav">
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                首页
              </NavLink>
              <NavLink to="/divination" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                占卜
              </NavLink>
              <NavLink to="/cards" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                牌库
              </NavLink>
              <NavLink to="/horoscope" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                运势
              </NavLink>
              <NavLink to="/statistics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                统计
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                我的
              </NavLink>
            </nav>
          </div>
        </header>
      )}
      <main className="main">
        <Outlet />
      </main>
      {!isMobile && (
        <footer className="footer">
          <p>© 2026 TarotQA - AI塔罗占卜 v{__APP_VERSION__ || '1.0.0'} ({__GIT_SHA__?.slice(0, 8) || 'local'})</p>
        </footer>
      )}
      {isMobile && (
        <nav className="mobile-nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">首页</span>
          </NavLink>
          <NavLink to="/divination" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <span className="nav-icon">🔮</span>
            <span className="nav-label">占卜</span>
          </NavLink>
          <NavLink to="/cards" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <span className="nav-icon">🃏</span>
            <span className="nav-label">牌库</span>
          </NavLink>
          <NavLink to="/statistics" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <span className="nav-icon">📊</span>
            <span className="nav-label">统计</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'mobile-nav-item active' : 'mobile-nav-item'}>
            <span className="nav-icon">👤</span>
            <span className="nav-label">我的</span>
          </NavLink>
        </nav>
      )}
      <ScrollIndicator />
    </div>
  );
}

export default Layout;