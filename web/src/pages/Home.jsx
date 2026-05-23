import { Link } from 'react-router-dom';
import { StarIcon, SparkleEffect, ConstellationPattern, OrbGlow } from '../components/common/DecorativeElements';
import { useLanguage } from '../context/LanguageContext';
import { useBackToTop } from '../hooks/useBackToTop';
import './Home.css';

function Home() {
  const { t } = useLanguage();
  const { showBackToTop, scrollToTop } = useBackToTop();

  return (
    <div className="home">
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title={t('回到顶部', 'Back to Top')} data-tooltip={t('回到顶部', 'Back to Top')}>
          <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10.5v10.5h14V10.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {/* 塔罗占卜区块 */}
      <section className="service-block tarot-hero">
        <div className="service-decoration">
          <StarIcon size={28} className="decoStarSvg star1" />
          <StarIcon size={22} className="decoStarSvg star2" />
          <StarIcon size={18} className="decoStarSvg star3" />
          <SparkleEffect size={50} intensity={0.4} className="decoSparkle" />
          <ConstellationPattern stars={4} size={50} className="decoConstellation" />
        </div>
        <div className="service-content">
          <div className="service-icon">🎴</div>
          <div className="service-info">
            <h2 className="service-title">{t('塔罗占卜', 'Tarot Divination')}</h2>
            <p className="service-desc">
              {t('探索命运的奥秘，获取专属解读。78张塔罗牌，多种牌阵，AI智能解读', 'Explore the mysteries of destiny and get exclusive interpretations. 78 tarot cards, multiple spreads, AI-powered analysis')}
            </p>
            <ul className="service-features">
              <li>{t('78张塔罗牌详解', '78 Tarot Cards Details')}</li>
              <li>{t('多种牌阵可选', 'Multiple Spreads Available')}</li>
              <li>{t('AI智能解读分析', 'AI-Powered Analysis')}</li>
              <li>{t('12星座每日运势', 'Daily Horoscope for 12 Signs')}</li>
            </ul>
          </div>
          <div className="service-action">
            <Link to="/divination" className="btn btn-primary">
              {t('开始占卜', 'Start Divination')}
            </Link>
          </div>
        </div>
      </section>

      {/* 紫微斗数区块 */}
      <section className="service-block ziwei-block">
        <div className="serviceDecorationZiwei">
          <OrbGlow size={60} className="decoOrb" />
          <StarIcon size={20} className="decoStarSvg star4" />
          <StarIcon size={16} className="decoStarSvg star5" />
          <SparkleEffect size={40} intensity={0.3} className="decoSparkle ziweiSparkle" />
        </div>
        <div className="service-content">
          <div className="service-icon">🀄</div>
          <div className="service-info">
            <h2 className="service-title">{t('紫微斗数', 'Ziwei Dou Shu')}</h2>
            <p className="service-desc">
              {t('中国传统命理体系，通过星曜分布解读人生运势、事业财运、感情婚姻', 'Traditional Chinese fortune-telling system, interpreting life destiny through star distribution')}
            </p>
            <ul className="service-features">
              <li>{t('命宫主星与身宫主星分析', 'Ming Gong & Shen Gong Analysis')}</li>
              <li>{t('十二宫位星曜分布', '12 Palace Star Distribution')}</li>
              <li>{t('四化飞星论断', 'Si Hua Flying Star Analysis')}</li>
              <li>{t('AI智能命盘解读', 'AI-Powered Chart Reading')}</li>
            </ul>
          </div>
          <div className="service-action">
            <Link to="/ziwei/chart" className="btn btn-primary">
              {t('立即排盘', 'Generate Chart')}
            </Link>
          </div>
        </div>
      </section>

      {/* 十二宫星盘区块 */}
      <section className="service-block astrology-block">
        <div className="serviceDecorationAstrology">
          <SparkleEffect size={60} intensity={0.5} className="decoSparkle astroSparkle" />
          <StarIcon size={24} className="decoStarSvg star6" />
          <StarIcon size={20} className="decoStarSvg star7" />
          <StarIcon size={16} className="decoStarSvg star8" />
          <ConstellationPattern stars={5} size={55} className="decoConstellation astroConstellation" />
        </div>
        <div className="service-content">
          <div className="service-icon">⭐</div>
          <div className="service-info">
            <h2 className="service-title">{t('十二宫星盘', 'Western Astrology')}</h2>
            <p className="service-desc">
              {t('西方占星术，通过行星相位与宫位分析性格特点、运势走向，人际关系', 'Western astrology, analyzing personality and fortune through planetary aspects and houses')}
            </p>
            <ul className="service-features">
              <li>{t('十大行星精确位置', 'Precise Positions of 10 Planets')}</li>
              <li>{t('十二星座分布', '12 Zodiac Sign Distribution')}</li>
              <li>{t('行星相位与 aspect 分析', 'Planetary Aspects Analysis')}</li>
              <li>{t('AI深度星盘解读', 'AI Deep Chart Analysis')}</li>
            </ul>
          </div>
          <div className="service-action">
            <Link to="/astrology/chart" className="btn btn-primary">
              {t('立即排盘', 'Generate Chart')}
            </Link>
          </div>
        </div>
      </section>
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title={t('回到顶部', 'Back to Top')} data-tooltip={t('回到顶部', 'Back to Top')}>
          <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10.5v10.5h14V10.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

export default Home;
