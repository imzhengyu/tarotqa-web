import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home">
      {/* 塔罗占卜区块 */}
      <section className="service-block tarot-hero">
        <div className="service-decoration">
          <div className="deco-star">♠</div>
          <div className="deco-star">♥</div>
          <div className="deco-star">♣</div>
          <div className="deco-star">♦</div>
        </div>
        <div className="service-content">
          <div className="service-icon">🎴</div>
          <div className="service-info">
            <h2 className="service-title">AI塔罗占卜</h2>
            <p className="service-desc">
              探索命运的奥秘，获取专属解读。78张塔罗牌，多种牌阵，AI智能解读
            </p>
            <ul className="service-features">
              <li>78张塔罗牌详解</li>
              <li>多种牌阵可选</li>
              <li>AI智能解读分析</li>
              <li>12星座每日运势</li>
            </ul>
          </div>
          <div className="service-action">
            <Link to="/divination" className="btn btn-primary">
              开始占卜
            </Link>
          </div>
        </div>
      </section>

      {/* 紫微斗数区块 */}
      <section className="service-block ziwei-block">
        <div className="service-decoration">
          <div className="deco-star">☆</div>
          <div className="deco-star">◇</div>
          <div className="deco-star">☆</div>
        </div>
        <div className="service-content">
          <div className="service-icon">🀄</div>
          <div className="service-info">
            <h2 className="service-title">紫微斗数</h2>
            <p className="service-desc">
              中国传统命理体系，通过星曜分布解读人生运势、事业财运、感情婚姻
            </p>
            <ul className="service-features">
              <li>命宫主星与身宫主星分析</li>
              <li>十二宫位星曜分布</li>
              <li>四化飞星论断</li>
              <li>AI智能命盘解读</li>
            </ul>
          </div>
          <div className="service-action">
            <Link to="/ziwei/chart" className="btn btn-primary">
              立即排盘
            </Link>
          </div>
        </div>
      </section>

      {/* 十二宫星盘区块 */}
      <section className="service-block astrology-block">
        <div className="service-decoration">
          <div className="deco-star">☉</div>
          <div className="deco-star">☽</div>
          <div className="deco-star">★</div>
        </div>
        <div className="service-content">
          <div className="service-icon">⭐</div>
          <div className="service-info">
            <h2 className="service-title">十二宫星盘</h2>
            <p className="service-desc">
              西方占星术，通过行星相位与宫位分析性格特点、运势走向，人际关系
            </p>
            <ul className="service-features">
              <li>十大行星精确位置</li>
              <li>十二星座分布</li>
              <li>行星相位与 aspect 分析</li>
              <li>AI深度星盘解读</li>
            </ul>
          </div>
          <div className="service-action">
            <Link to="/astrology/chart" className="btn btn-primary">
              立即排盘
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
