import { Link } from 'react-router-dom';
import './Home.css';

console.log('Home component loading...');

function Home() {
  console.log('Home rendering...');

  return (
    <div className="home" style={{ padding: '20px', minHeight: '100vh' }}>
      <section className="hero" style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(45, 27, 78, 0.5)', borderRadius: '16px', marginBottom: '60px' }}>
        <h1 className="hero-title" style={{ fontSize: '48px', color: '#D4AF37', marginBottom: '16px' }}>
          🔮 AI塔罗占卜
        </h1>
        <p className="hero-subtitle" style={{ fontSize: '20px', color: '#B8A9C9', marginBottom: '32px' }}>
          探索命运的奥秘，获取专属解读
        </p>
        <Link to="/divination" className="btn btn-primary hero-btn" style={{ padding: '16px 48px', fontSize: '18px' }}>
          开始占卜
        </Link>
      </section>

      <section className="features">
        <h2 className="section-title" style={{ fontSize: '28px', color: '#D4AF37', textAlign: 'center', marginBottom: '32px' }}>核心功能</h2>
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          <div className="feature-card" style={{ background: 'rgba(45, 27, 78, 0.6)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🎴</div>
            <h3 style={{ color: '#F5F5F5', marginBottom: '8px' }}>78张塔罗牌</h3>
            <p style={{ color: '#B8A9C9', fontSize: '14px' }}>涵盖大阿卡纳与小阿卡纳，详解每张牌的含义</p>
          </div>
          <div className="feature-card" style={{ background: 'rgba(45, 27, 78, 0.6)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h3 style={{ color: '#F5F5F5', marginBottom: '8px' }}>AI智能解读</h3>
            <p style={{ color: '#B8A9C9', fontSize: '14px' }}>MiniMax大模型驱动，深度分析您的命运走向</p>
          </div>
          <div className="feature-card" style={{ background: 'rgba(45, 27, 78, 0.6)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
            <h3 style={{ color: '#F5F5F5', marginBottom: '8px' }}>每日运势</h3>
            <p style={{ color: '#B8A9C9', fontSize: '14px' }}>12星座专属运势，助您把握每日机遇</p>
          </div>
          <div className="feature-card" style={{ background: 'rgba(45, 27, 78, 0.6)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>💎</div>
            <h3 style={{ color: '#F5F5F5', marginBottom: '8px' }}>VIP专属牌阵</h3>
            <p style={{ color: '#B8A9C9', fontSize: '14px' }}>命运之轮、灵魂探索等高级牌阵</p>
          </div>
        </div>
      </section>

      <section className="spreads" style={{ marginTop: '60px' }}>
        <h2 className="section-title" style={{ fontSize: '28px', color: '#D4AF37', textAlign: 'center', marginBottom: '32px' }}>热门牌阵</h2>
        <div className="spreads-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div className="spread-card" style={{ background: 'rgba(45, 27, 78, 0.6)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '8px' }}>单牌阵</h3>
            <p style={{ color: '#B8A9C9', fontSize: '14px', marginBottom: '12px' }}>快速简单，适合简单问题</p>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(212, 175, 55, 0.2)', borderRadius: '20px', fontSize: '12px', color: '#D4AF37' }}>1张牌</span>
          </div>
          <div className="spread-card" style={{ background: 'rgba(45, 27, 78, 0.6)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '8px' }}>三牌阵</h3>
            <p style={{ color: '#B8A9C9', fontSize: '14px', marginBottom: '12px' }}>过去-现在-未来时间线</p>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(212, 175, 55, 0.2)', borderRadius: '20px', fontSize: '12px', color: '#D4AF37' }}>3张牌</span>
          </div>
          <div className="spread-card" style={{ background: 'rgba(45, 27, 78, 0.6)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h3 style={{ color: '#D4AF37', marginBottom: '8px' }}>凯尔特十字</h3>
            <p style={{ color: '#B8A9C9', fontSize: '14px', marginBottom: '12px' }}>深度详细分析</p>
            <span style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(212, 175, 55, 0.2)', borderRadius: '20px', fontSize: '12px', color: '#D4AF37' }}>10张牌</span>
          </div>
        </div>
        <div className="spreads-action" style={{ textAlign: 'center' }}>
          <Link to="/divination" className="btn btn-secondary" style={{ padding: '12px 24px', border: '1px solid #D4AF37', borderRadius: '8px', color: '#D4AF37' }}>
            查看全部牌阵
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;