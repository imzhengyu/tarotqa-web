import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">
          AI塔罗占卜
        </h1>
        <p className="hero-subtitle">
          探索命运的奥秘，获取专属解读
        </p>
        <Link to="/divination" className="btn btn-primary hero-btn">
          开始占卜
        </Link>
      </section>

      <section className="features">
        <h2 className="section-title">核心功能</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎴</div>
            <h3>78张塔罗牌</h3>
            <p>涵盖大阿卡纳与小阿卡纳，详解每张牌的含义</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI智能解读</h3>
            <p>MiniMax大模型驱动，深度分析您的命运走向</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⭐</div>
            <h3>每日运势</h3>
            <p>12星座专属运势，助您把握每日机遇</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💎</div>
            <h3>VIP专属牌阵</h3>
            <p>命运之轮、灵魂探索等高级牌阵</p>
          </div>
        </div>
      </section>

      <section className="spreads">
        <h2 className="section-title">热门牌阵</h2>
        <div className="spreads-grid">
          <div className="spread-card">
            <h3>单牌阵</h3>
            <p>快速简单，适合简单问题</p>
            <span className="spread-info">1张牌</span>
          </div>
          <div className="spread-card">
            <h3>三牌阵</h3>
            <p>过去-现在-未来时间线</p>
            <span className="spread-info">3张牌</span>
          </div>
          <div className="spread-card">
            <h3>凯尔特十字</h3>
            <p>深度详细分析</p>
            <span className="spread-info">10张牌</span>
          </div>
        </div>
        <div className="spreads-action">
          <Link to="/divination" className="btn btn-secondary">
            查看全部牌阵
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
