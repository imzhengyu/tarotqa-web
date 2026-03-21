import { Outlet, NavLink, Link } from 'react-router-dom';
import ScrollIndicator from './ScrollIndicator';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
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
            <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              我的
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>© 2026 TarotQA - AI塔罗占卜</p>
      </footer>
      <ScrollIndicator />
    </div>
  );
}

export default Layout;