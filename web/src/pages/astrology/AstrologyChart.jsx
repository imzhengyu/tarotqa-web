import { useState, useCallback, useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import BirthInfoForm from '../../components/common/BirthInfoForm';
import DisclaimerModal from '../../components/common/DisclaimerModal';
import { useAIRequestCooldown } from '../../hooks/useAIRequestCooldown';
import { calculateAstrologyChart } from '../../utils/astrology/calculations';
import { ZODIAC_SIGNS, PLANET_COLORS } from '../../utils/astrology/constants';
import api from '../../services/api';
import './AstrologyChart.css';

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// 启用表格支持
md.enable('table');

const CHART_SIZE = 500;
const CENTER = CHART_SIZE / 2;
const OUTER_RADIUS = 230;
const INNER_RADIUS = 180;
const HOUSE_RADIUS = 150;
const PLANET_RADIUS = 120;

function AstrologyChart() {
  const [birthData, setBirthData] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

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
    try {
      const data = calculateAstrologyChart(birthData);
      setChartData(data);
      setAiInterpretation(null);
      startCooldownTimer();
    } catch (error) {
      console.error('Error generating chart:', error);
    }
  }, [birthData, startCooldownTimer]);

  const handleAIInterpretation = async () => {
    if (aiLoading || aiCooldown > 0 || !chartData) return;

    setAiInterpretation(null);
    setAiLoading(true);
    setAiError(null);

    try {
      const interpretation = await api.getAIAstrologyInterpretation(chartData);
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

  // Generate SVG path for zodiac ring
  const zodiacRing = useMemo(() => {
    const signs = [];
    for (let i = 0; i < 12; i++) {
      const startAngle = (i * 30 - 90) * Math.PI / 180;
      const endAngle = ((i + 1) * 30 - 90) * Math.PI / 180;
      const midAngle = ((i * 30 + 15) - 90) * Math.PI / 180;

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

  // Generate house divisions
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

  // Generate planet positions
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
        {/* Background circle */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          fill="none"
          stroke="rgba(212, 175, 55, 0.3)"
          strokeWidth="2"
        />

        {/* Zodiac ring */}
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

        {/* Inner ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          fill="none"
          stroke="rgba(212, 175, 55, 0.3)"
          strokeWidth="1"
        />

        {/* House ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={HOUSE_RADIUS}
          fill="none"
          stroke="rgba(212, 175, 55, 0.2)"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* House lines */}
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
            {/* House number */}
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

        {/* Ascendant, MC markers */}
        {chartData && (
          <>
            {/* Ascendant */}
            <text
              x={CENTER + 5}
              y={CENTER - 5}
              fill="#D4AF37"
              fontSize="12"
              textAnchor="middle"
            >
              ASC
            </text>
            {/* MC */}
            <text
              x={CENTER + 5}
              y={CENTER + 15}
              fill="#D4AF37"
              fontSize="10"
              textAnchor="middle"
            >
              MC
            </text>
          </>
        )}

        {/* Planet positions */}
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
          <span className="cooldown-text">请等待 {aiCooldown}s 后再试</span>
        </div>
      )}

      <h1 className="page-title">西方星盘排盘</h1>

      <div className="astrology-layout">
        <div className="astrology-form-section">
          <div className="form-card">
            <h2>出生信息</h2>
            <BirthInfoForm
              value={birthData}
              onChange={handleBirthDataChange}
              showGender={false}
            />
            <button
              className="btn btn-primary generate-btn"
              onClick={handleGenerateChart}
              disabled={!birthData}
            >
              生成星盘
            </button>
          </div>

          {chartData && (
            <div className="planet-list">
              <h3>行星位置</h3>
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
                  <span className="planet-name">{planet.name}</span>
                  <span className="planet-sign">
                    {planet.sign?.symbol} {planet.sign?.name} {Math.round(planet.degree)}°
                  </span>
                </div>
              ))}
            </div>
          )}

          {aiError && (
            <div className="ai-error">
              <p>错误: {aiError}</p>
              <button onClick={() => setAiError(null)}>关闭</button>
            </div>
          )}
        </div>

        <div className="astrology-chart-section">
          {chartData ? (
            <>
              <div className="chart-container">
                {renderChart()}
              </div>
              {chartData && birthData && (
                <div className="ai-action">
                  <button
                    className="btn btn-secondary"
                    onClick={handleAIInterpretation}
                    disabled={aiLoading || aiCooldown > 0}
                  >
                    {aiLoading ? '分析中...' : aiCooldown > 0 ? `请等待 ${aiCooldown}s` : 'AI 星盘分析'}
                  </button>
                </div>
              )}
              {aiInterpretation && (
                <div className="ai-interpretation">
                  <h3>AI 星盘分析</h3>
                  {renderMarkdownContent(aiInterpretation)}
                </div>
              )}
            </>
          ) : (
            <div className="chart-placeholder">
              <div className="placeholder-icon">⭐</div>
              <p>请填写出生信息并点击&quot;生成星盘&quot;</p>
            </div>
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
              {selectedPlanet.name}
            </h2>
            <div className="planet-detail-content">
              <p><strong>所在星座：</strong>{selectedPlanet.sign?.name}</p>
              <p><strong>精确度：</strong>{Math.round(selectedPlanet.degree)}°</p>
              <p><strong>黄经：</strong>{Math.round(selectedPlanet.longitude)}°</p>
            </div>
          </dialog>
        </div>
      )}

      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        type="astrology"
      />
    </div>
  );
}

export default AstrologyChart;
