import { useState, useCallback, useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import DOMPurify from 'dompurify';
import BirthInfoForm from '../../components/common/BirthInfoForm';
import DisclaimerModal from '../../components/common/DisclaimerModal';
import DelayedPoofButton from '../../components/common/DelayedPoofButton';
import { StarIcon, SparkleEffect, ConstellationPattern } from '../../components/common/DecorativeElements';
import { useAIRequestCooldown } from '../../hooks/useAIRequestCooldown';
import { useBackToTop } from '../../hooks/useBackToTop';
import { calculateAstrologyChart } from '../../utils/astrology/calculations';
import { ZODIAC_SIGNS, PLANET_COLORS } from '../../utils/astrology/constants';
import { useLanguage } from '../../context/LanguageContext';
import { ASTROLOGY_CHART } from '../../constants';
import { exportToPNG } from '../../utils/export';
import { formatTimestamp } from '../../utils/date';
import api from '../../services/api';
import './AstrologyChart.css';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
}).use(markdownItMultimdTable, {
  multiline: true,
  header: true
});

const generateAstrologyFilename = (birthData) => {
  if (!birthData) return `astrology-${formatTimestamp()}`;
  const { year, month, day, hour, minute } = birthData;
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${year}${pad(month)}${pad(day)}`;
  const timeStr = `${pad(hour)}${pad(minute)}`;
  return `astrology-${dateStr}_${timeStr}-${formatTimestamp()}`;
};

const {
  CHART_SIZE,
  CENTER,
  OUTER_RADIUS,
  INNER_RADIUS,
  HOUSE_RADIUS,
  PLANET_RADIUS,
  ZODIAC_SEGMENT_DEGREES,
  ZODIAC_OFFSET_DEGREES,
  ZODIAC_MIDPOINT_OFFSET
} = ASTROLOGY_CHART;

function AstrologyChart() {
  const { language, t } = useLanguage();
  const [birthData, setBirthData] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [chartError, setChartError] = useState(null);
  const { showBackToTop, scrollToTop } = useBackToTop();

  const {
    aiCooldown,
    showCooldownToast,
    startCooldownTimer,
    startCooldown
  } = useAIRequestCooldown('ai_astrology_cooldown_end');

  const handleBirthDataChange = useCallback((data) => {
    setBirthData(data);
  }, []);

  const handleGenerateChart = useCallback(() => {
    if (!birthData) return;
    setChartError(null);
    try {
      const data = calculateAstrologyChart(birthData);
      setChartData(data);
      setAiInterpretation(null);
      startCooldownTimer();
    } catch (error) {
      console.error('Error generating chart:', error);
      setChartError(error.message || '生成星盘失败');
    }
  }, [birthData, startCooldownTimer]);

  const handleAIInterpretation = async () => {
    if (aiLoading || aiCooldown > 0 || !chartData) return;

    setAiInterpretation(null);
    setAiLoading(true);
    setAiError(null);

    try {
      const interpretation = await api.getAIAstrologyInterpretation(chartData, language);
      startCooldown();
      setAiInterpretation(interpretation);
    } catch (error) {
      console.error('[AI星盘解读] 捕获错误:', error.message);
      startCooldown();
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const zodiacRing = useMemo(() => {
    const signs = [];
    for (let i = 0; i < 12; i++) {
      const startAngle = (i * ZODIAC_SEGMENT_DEGREES - ZODIAC_OFFSET_DEGREES) * Math.PI / 180;
      const endAngle = ((i + 1) * ZODIAC_SEGMENT_DEGREES - ZODIAC_OFFSET_DEGREES) * Math.PI / 180;
      const midAngle = ((i * ZODIAC_SEGMENT_DEGREES + ZODIAC_MIDPOINT_OFFSET) - ZODIAC_OFFSET_DEGREES) * Math.PI / 180;

      const x1 = CENTER + OUTER_RADIUS * Math.cos(startAngle);
      const y1 = CENTER + OUTER_RADIUS * Math.sin(startAngle);
      const x2 = CENTER + OUTER_RADIUS * Math.cos(endAngle);
      const y2 = CENTER + OUTER_RADIUS * Math.sin(endAngle);

      const innerX1 = CENTER + (OUTER_RADIUS - 20) * Math.cos(startAngle);
      const innerY1 = CENTER + (OUTER_RADIUS - 20) * Math.sin(startAngle);
      const innerX2 = CENTER + (OUTER_RADIUS - 20) * Math.cos(endAngle);
      const innerY2 = CENTER + (OUTER_RADIUS - 20) * Math.sin(endAngle);

      const path = `M ${x1} ${y1} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 1 ${x2} ${y2} L ${innerX2} ${innerY2} A ${OUTER_RADIUS - 20} ${OUTER_RADIUS - 20} 0 0 0 ${innerX1} ${innerY1} Z`;

      const symbolX = CENTER + (OUTER_RADIUS - 35) * Math.cos(midAngle);
      const symbolY = CENTER + (OUTER_RADIUS - 35) * Math.sin(midAngle);

      signs.push({
        path,
        symbol: ZODIAC_SIGNS[i].symbol,
        x: symbolX,
        y: symbolY,
        name: ZODIAC_SIGNS[i].name
      });
    }
    return signs;
  }, []);

  const houseLines = useMemo(() => {
    if (!chartData) return [];
    return chartData.houses.map((house) => {
      const angle = (house.longitude - 90) * Math.PI / 180;
      const x1 = CENTER + (OUTER_RADIUS - 40) * Math.cos(angle);
      const y1 = CENTER + (OUTER_RADIUS - 40) * Math.sin(angle);
      const x2 = CENTER + (HOUSE_RADIUS + 10) * Math.cos(angle);
      const y2 = CENTER + (HOUSE_RADIUS + 10) * Math.sin(angle);
      return { x1, y1, x2, y2, house };
    });
  }, [chartData]);

  const planetPositions = useMemo(() => {
    if (!chartData) return [];
    return chartData.planets.map(planet => {
      const angle = (planet.longitude - 90) * Math.PI / 180;
      const x = CENTER + PLANET_RADIUS * Math.cos(angle);
      const y = CENTER + PLANET_RADIUS * Math.sin(angle);
      return { ...planet, x, y };
    });
  }, [chartData]);

  const renderChart = () => {
    return (
      <svg
        viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        className="astrology-svg"
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          fill="none"
          stroke="rgba(212, 175, 55, 0.3)"
          strokeWidth="2"
        />

        {zodiacRing.map((sign, index) => (
          <g key={index}>
            <path
              d={sign.path}
              fill={`rgba(45, 27, 78, ${0.3 + (index % 3) * 0.1})`}
              stroke="rgba(212, 175, 55, 0.2)"
              strokeWidth="1"
            />
            <text
              x={sign.x}
              y={sign.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#D4AF37"
              fontSize="20"
              style={{ userSelect: 'none' }}
            >
              {sign.symbol}
            </text>
          </g>
        ))}

        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          fill="none"
          stroke="rgba(212, 175, 55, 0.3)"
          strokeWidth="1"
        />

        <circle
          cx={CENTER}
          cy={CENTER}
          r={HOUSE_RADIUS}
          fill="none"
          stroke="rgba(212, 175, 55, 0.2)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {houseLines.map((line, index) => (
          <g key={index}>
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="rgba(212, 175, 55, 0.4)"
              strokeWidth="1"
            />
            <text
              x={(line.x1 + CENTER) / 2 + 15}
              y={(line.y1 + CENTER) / 2 + 15}
              fill="rgba(212, 175, 55, 0.6)"
              fontSize="10"
              textAnchor="middle"
            >
              {line.house.id}
            </text>
          </g>
        ))}

        {chartData && (
          <>
            <text
              x={CENTER + 5}
              y={CENTER - 5}
              fill="#D4AF37"
              fontSize="12"
              textAnchor="middle"
            >
              {t('ASC', 'ASC')}
            </text>
            <text
              x={CENTER + 5}
              y={CENTER + 15}
              fill="#D4AF37"
              fontSize="10"
              textAnchor="middle"
            >
              {t('MC', 'MC')}
            </text>
          </>
        )}

        {planetPositions.map((planet, index) => (
          <g
            key={index}
            className="planet-marker"
            onClick={() => setSelectedPlanet(planet)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={planet.x}
              cy={planet.y}
              r="16"
              fill={PLANET_COLORS[planet.id] || '#888'}
              fillOpacity="0.8"
              stroke="#fff"
              strokeWidth="1"
            />
            <text
              x={planet.x}
              y={planet.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#fff"
              fontSize="12"
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {planet.symbol}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const renderMarkdownContent = (content) => {
    if (!content) return '';
    try {
      const html = md.render(content);
      const clean = DOMPurify.sanitize(html);
      return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: clean }} />;
    } catch (error) {
      console.error('[Markdown渲染] 解析失败:', error);
      return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</pre>;
    }
  };

  return (
    <div className="astrology-chart-page">
      {showCooldownToast && aiCooldown > 0 && (
        <div className="cooldown-toast">
          <span className="cooldown-icon">⏳</span>
          <span className="cooldown-text">{language === 'zh' ? `请等待 ${aiCooldown}s 后再试` : `Please wait ${aiCooldown}s`}</span>
        </div>
      )}

      <h1 className="page-title">{t('西方星盘排盘', 'Western Astrology Chart')}</h1>

      <div className="astrology-layout">
        <div className="astrology-form-section">
          <div className="form-card">
            <h2>{t('出生信息', 'Birth Information')}</h2>
            <BirthInfoForm
              value={birthData}
              onChange={handleBirthDataChange}
              showGender={false}
            />
            <DelayedPoofButton
              className="btn btn-primary generate-btn"
              onClick={handleGenerateChart}
              disabled={!birthData}
            >
              {t('生成星盘', 'Generate Chart')}
            </DelayedPoofButton>
          </div>

          {chartData && (
            <div className="planet-list">
              <h3>{t('行星位置', 'Planet Positions')}</h3>
              {chartData.planets.map(planet => (
                <div
                  key={planet.id}
                  className="planet-item"
                  onClick={() => setSelectedPlanet(planet)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedPlanet(planet)}
                  role="button"
                  tabIndex={0}
                >
                  <span
                    className="planet-symbol"
                    style={{ color: PLANET_COLORS[planet.id] }}
                  >
                    {planet.symbol}
                  </span>
                  <span className="planet-name">{language === 'zh' ? planet.name : planet.nameEn}</span>
                  <span className="planet-sign">
                    {planet.sign?.symbol} {language === 'zh' ? planet.sign?.name : planet.sign?.nameEn} {Math.round(planet.degree)}°
                  </span>
                </div>
              ))}
            </div>
          )}

          {aiError && (
            <div className="ai-error">
              <p>{t('错误: ', 'Error: ')}{aiError}</p>
              <button onClick={() => setAiError(null)}>{t('关闭', 'Close')}</button>
            </div>
          )}
        </div>

        <div className="astrology-chart-section">
          {chartData ? (
            <>
              <div className="chartWrapper">
                <div className="chartDecorations">
                  <StarIcon size={18} className="chartStar star1" />
                  <StarIcon size={14} className="chartStar star2" />
                  <StarIcon size={16} className="chartStar star3" />
                  <StarIcon size={12} className="chartStar star4" />
                  <SparkleEffect size={40} intensity={0.5} className="chartSparkle sparkle1" />
                  <SparkleEffect size={35} intensity={0.4} className="chartSparkle sparkle2" />
                  <ConstellationPattern stars={4} size={45} className="chartConstellation" />
                </div>
                <div className="chart-container">
                  {renderChart()}
                </div>
              </div>
              {chartData && birthData && (
                <div className="ai-action">
                  <button
                    className="btn btn-secondary"
                    onClick={handleAIInterpretation}
                    disabled={aiLoading || aiCooldown > 0}
                  >
                    {aiLoading ? t('分析中...', 'Analyzing...') : aiCooldown > 0 ? `${t('请等待', 'Wait')} ${aiCooldown}s` : t('AI 星盘分析', 'AI Chart Analysis')}
                  </button>
                </div>
              )}
              {aiInterpretation && (
                <>
                  <div className="ai-interpretation" id="astrology-ai-result">
                    <h3>{t('AI 星盘分析', 'AI Chart Analysis')}</h3>
                    {renderMarkdownContent(aiInterpretation)}
                  </div>
                  <div className="ai-export-section">
                    <button
                      className="btn btn-secondary export-ai-btn"
                      onClick={() => exportToPNG('astrology-ai-result', generateAstrologyFilename(birthData))}
                      title={t('输出PNG图片', 'Export as PNG')}
                    >
                      📥 {t('导出分析结果', 'Export Analysis')}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {chartError && (
                <div className="ai-error">
                  <p>{t('星盘生成失败: ', 'Chart generation failed: ')}{chartError}</p>
                  <button onClick={() => setChartError(null)}>{t('关闭', 'Close')}</button>
                </div>
              )}
              <div className="chart-placeholder">
                <div className="placeholder-icon">⭐</div>
                <p>{t('请填写出生信息并点击"生成星盘"', 'Please fill in birth info and click "Generate Chart"')}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedPlanet && (
        <div
          className="planet-detail-modal-overlay"
          onClick={() => setSelectedPlanet(null)}
          onKeyDown={(e) => e.key === 'Escape' && setSelectedPlanet(null)}
          role="presentation"
        >
          <dialog
            className="planet-detail-modal"
            aria-modal="true"
          >
            <button className="close-btn" onClick={() => setSelectedPlanet(null)}>×</button>
            <h2>
              <span style={{ color: PLANET_COLORS[selectedPlanet.id] }}>
                {selectedPlanet.symbol}
              </span>
              {language === 'zh' ? selectedPlanet.name : selectedPlanet.nameEn}
            </h2>
            <div className="planet-detail-content">
              <p><strong>{t('所在星座：', 'Sign: ')}</strong>{language === 'zh' ? selectedPlanet.sign?.name : selectedPlanet.sign?.nameEn}</p>
              <p><strong>{t('精确度：', 'Degree: ')}</strong>{Math.round(selectedPlanet.degree)}°</p>
              <p><strong>{t('黄经：', 'Longitude: ')}</strong>{Math.round(selectedPlanet.longitude)}°</p>
            </div>
          </dialog>
        </div>
      )}

      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        type="astrology"
      />
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title={t('回到顶部', 'Back to Top')} data-tooltip={t('回到顶部', 'Back to Top')}>
          <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10.5v10.5h14V10.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

export default AstrologyChart;
