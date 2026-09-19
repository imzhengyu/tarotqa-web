import { useState, useCallback, useMemo } from 'react';
import BirthInfoForm from '../../components/common/BirthInfoForm';
import DisclaimerModal from '../../components/common/DisclaimerModal';
import DelayedPoofButton from '../../components/common/DelayedPoofButton';
import MarkdownSection from '../../components/common/MarkdownSection';
import { useAIRequestCooldown } from '../../hooks/useAIRequestCooldown';
import { useBackToTop } from '../../hooks/useBackToTop';
import { useDevice } from '../../hooks/useDevice';
import { calculateAstrologyChart } from '../../utils/astrology/calculations';
import { ZODIAC_SIGNS, PLANETS, PLANET_COLORS } from '../../utils/astrology/constants';
import { useLanguage } from '../../context/LanguageContext';
import { ASTROLOGY_CHART } from '../../constants';
import PdfExportButton from '../../components/common/PdfExportButton';
import { formatTimestamp } from '../../utils/date';
import api from '../../services/api';
import './AstrologyChart.css';

const markdownPlugins = [
  { loader: () => import('markdown-it-multimd-table'), options: { multiline: true, header: true } }
];

// 十二宫扇区底色：用主题浅色令牌轮换，替代旧的深紫色块（在米色底上会像缺口）
const ZODIAC_SEGMENT_FILLS = ['var(--primary-soft)', 'var(--surface-alt)', 'var(--accent-soft)'];

export const generateAstrologyFilename = (birthData) => {
  if (!birthData) return `astrology-${formatTimestamp()}`;
  const { year, month, day, hour, minute } = birthData;
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${year}${pad(month)}${pad(day)}`;
  const timeStr = `${pad(hour)}${pad(minute)}`;
  return `astrology-${dateStr}_${timeStr}-${formatTimestamp()}`;
};

/** 把观测点格式化成 121.47°E / 31.23°N 这样的可读文本 */
export const formatObserverLocation = (observer) => {
  if (!observer) return '';
  const { longitude, latitude } = observer;
  const lon = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`;
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}`;
  return `${lon} / ${lat}`;
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

const INITIAL_PLANETS = PLANETS.map(p => ({ ...p, sign: ZODIAC_SIGNS[0], degree: 0 }));

function AstrologyChart() {
  const { language, t } = useLanguage();
  const { deviceType } = useDevice();
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
  } = useAIRequestCooldown();

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
    setAiError(null);
    setAiLoading(true);

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
          stroke="var(--border-strong)"
          strokeWidth="2"
        />

        {zodiacRing.map((sign, index) => (
          <g key={index}>
            <path
              d={sign.path}
              fill={ZODIAC_SEGMENT_FILLS[index % ZODIAC_SEGMENT_FILLS.length]}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={sign.x}
              y={sign.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--accent-ink)"
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
          stroke="var(--border)"
          strokeWidth="1"
        />

        <circle
          cx={CENTER}
          cy={CENTER}
          r={HOUSE_RADIUS}
          fill="none"
          stroke="var(--border)"
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
              stroke="var(--border-strong)"
              strokeWidth="1"
            />
            <text
              x={(line.x1 + CENTER) / 2 + 15}
              y={(line.y1 + CENTER) / 2 + 15}
              fill="var(--accent-ink)"
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
              fill="var(--accent-ink)"
              fontSize="12"
              textAnchor="middle"
            >
              {t('ASC', 'ASC')}
            </text>
            <text
              x={CENTER + 5}
              y={CENTER + 15}
              fill="var(--accent-ink)"
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
              fill={PLANET_COLORS[planet.id] || 'var(--text-muted)'}
              stroke="var(--surface)"
              strokeWidth="1"
            />
            <text
              x={planet.x}
              y={planet.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FFFFFF"
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

  // Markdown 渲染通过 <MarkdownSection> 异步完成（首次使用时动态加载 markdown-it + DOMPurify）

  return (
    <div className={`astrology-chart-page layout-${deviceType}`}>
      {showCooldownToast && aiCooldown > 0 && (
        <div className="cooldown-toast">
          <span className="cooldown-icon">⏳</span>
          <span className="cooldown-text">{language === 'zh' ? `请等待 ${aiCooldown}s 后再试` : `Please wait ${aiCooldown}s`}</span>
        </div>
      )}

      <h1 className="page-title">{t('西方星盘排盘', 'Western Astrology Chart')}</h1>

      <div className="astrology-input-row">
        <div className="form-card">
          <h2>{t('出生信息', 'Birth Information')}</h2>
          <BirthInfoForm
            value={birthData}
            onChange={handleBirthDataChange}
            showGender={false}
            showLocation={true}
          />
          <DelayedPoofButton
            className="btn btn-primary generate-btn"
            onClick={handleGenerateChart}
            disabled={!birthData}
          >
            {t('生成星盘', 'Generate Chart')}
          </DelayedPoofButton>
        </div>

        <div className="planet-list-card">
          <div className="planet-list">
            <h3>{t('行星位置', 'Planet Positions')}</h3>
            <div className="planet-grid">
              {(chartData?.planets || INITIAL_PLANETS).map(planet => (
                <button
                  key={planet.id}
                  type="button"
                  className="planet-item"
                  onClick={() => chartData && setSelectedPlanet(planet)}
                  disabled={!chartData}
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
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="astrology-chart-section">
        {chartData ? (
          <>
            <div className="chartWrapper">
              <div className="chart-container">
                {renderChart()}
              </div>
            </div>
            {chartData.observer?.assumed && (
              <p className="observer-note">
                {t(
                  `上升点与宫位按默认出生地（${formatObserverLocation(chartData.observer)}）估算，填写出生地经纬度可提高精度。`,
                  `Ascendant and houses assume a default birthplace (${formatObserverLocation(chartData.observer)}). Fill in the birth coordinates for higher accuracy.`
                )}
              </p>
            )}
            {birthData && (
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
            {aiError && (
              <div className="ai-error">
                <p>{t('错误: ', 'Error: ')}{aiError}</p>
                <button onClick={() => setAiError(null)}>{t('关闭', 'Close')}</button>
              </div>
            )}
            {aiInterpretation && (
              <>
                <div className="ai-interpretation" id="astrology-ai-result">
                  <h3>{t('AI 星盘分析', 'AI Chart Analysis')}</h3>
                  <MarkdownSection content={aiInterpretation} plugins={markdownPlugins} />
                </div>
                <div className="ai-export-section">
                  <PdfExportButton
                    markdown={aiInterpretation}
                    filename={generateAstrologyFilename(birthData)}
                    meta={{
                      title: t('西方星盘 · AI 解读', 'Western Astrology · AI Analysis'),
                      subtitle: `${birthData?.year}-${String(birthData?.month).padStart(2, '0')}-${String(birthData?.day).padStart(2, '0')} ${String(birthData?.hour).padStart(2, '0')}:${String(birthData?.minute).padStart(2, '0')}`
                    }}
                  />
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
              <p>{t('点击生成星盘', 'Click Generate Chart')}</p>
            </div>
          </>
        )}
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
