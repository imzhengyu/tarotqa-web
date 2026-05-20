import { useState, useCallback } from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import { Iztrolabe } from 'react-iztro';
import BirthInfoForm from '../../components/common/BirthInfoForm';
import DisclaimerModal from '../../components/common/DisclaimerModal';
import { useAIRequestCooldown } from '../../hooks/useAIRequestCooldown';
import { generateZiweiData, formatZiweiPrompt } from '../../utils/ziwei/ziweiData';
import api from '../../services/api';
import './ZiweiChart.css';

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// 启用表格支持
md.enable('table');

function ZiweiChart() {
  const [birthData, setBirthData] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [chartGenerated, setChartGenerated] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const {
    aiCooldown,
    showCooldownToast,
    startCooldownTimer,
    startCooldown
  } = useAIRequestCooldown('ai_ziwei_cooldown_end');

  const handleBirthDataChange = useCallback((data) => {
    setBirthData(data);
  }, []);

  const handleGenerateChart = useCallback(() => {
    if (!birthData) return;
    setChartGenerated(true);
    setAiInterpretation(null);
    startCooldownTimer();
  }, [birthData, startCooldownTimer]);

  const handleAIInterpretation = async () => {
    if (aiLoading || aiCooldown > 0 || !birthData) return;

    setAiInterpretation(null);
    setAiLoading(true);
    setAiError(null);

    try {
      const birthdayStr = `${birthData.year}-${String(birthData.month).padStart(2, '0')}-${String(birthData.day).padStart(2, '0')}`;

      // 使用 iztro 生成完整的命盘数据
      const ziweiData = generateZiweiData(birthdayStr, birthData.hour, birthData.gender, 'solar');
      const ziweiPrompt = formatZiweiPrompt(ziweiData);

      const interpretation = await api.getAIZiweiInterpretation({
        birthday: birthdayStr,
        birthTime: birthData.hour,
        gender: birthData.gender,
        birthdayType: 'solar',
        ziweiData: ziweiPrompt
      });
      startCooldown();
      setAiInterpretation(interpretation);
    } catch (error) {
      console.error('[AI紫微解读] 捕获错误:', error.message);
      startCooldown();
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
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

  const formatBirthday = () => {
    if (!birthData) return '';
    return `${birthData.year}-${String(birthData.month).padStart(2, '0')}-${String(birthData.day).padStart(2, '0')}`;
  };

  return (
    <div className="ziwei-chart-page">
      {showCooldownToast && aiCooldown > 0 && (
        <div className="cooldown-toast">
          <span className="cooldown-icon">⏳</span>
          <span className="cooldown-text">请等待 {aiCooldown}s 后再试</span>
        </div>
      )}

      <h1 className="page-title">紫微斗数排盘</h1>

      <div className="ziwei-layout">
        <div className="ziwei-form-section">
          <div className="form-card">
            <h2>出生信息</h2>
            <BirthInfoForm
              value={birthData}
              onChange={handleBirthDataChange}
              showGender={true}
            />
            <button
              className="btn btn-primary generate-btn"
              onClick={handleGenerateChart}
              disabled={!birthData}
            >
              生成命盘
            </button>
          </div>

          {chartGenerated && birthData && (
            <div className="ai-action">
              <button
                className="btn btn-secondary"
                onClick={handleAIInterpretation}
                disabled={aiLoading || aiCooldown > 0}
              >
                {aiLoading ? '分析中...' : aiCooldown > 0 ? `请等待 ${aiCooldown}s` : 'AI 命盘分析'}
              </button>
            </div>
          )}

          {aiError && (
            <div className="ai-error">
              <p>错误: {aiError}</p>
              <button onClick={() => setAiError(null)}>关闭</button>
            </div>
          )}
        </div>

        <div className="ziwei-chart-section">
          {chartGenerated && birthData ? (
            <div className="chart-container">
              <Iztrolabe
                birthday={formatBirthday()}
                birthTime={birthData.hour}
                birthdayType="solar"
                gender={birthData.gender}
                width="100%"
                horoscopeDate={new Date()}
              />
            </div>
          ) : (
            <div className="chart-placeholder">
              <div className="placeholder-icon">🀄</div>
              <p>请填写出生信息并点击&quot;生成命盘&quot;</p>
            </div>
          )}
        </div>
      </div>

      {(aiInterpretation || aiError) && (
        <div className="ziwei-ai-section">
          {aiError && (
            <div className="ai-error">
              <p>错误: {aiError}</p>
              <button onClick={() => setAiError(null)}>关闭</button>
            </div>
          )}
          {aiInterpretation && (
            <div className="ai-interpretation">
              <h3>AI 命盘分析</h3>
              {renderMarkdownContent(aiInterpretation)}
            </div>
          )}
        </div>
      )}

      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        type="ziwei"
      />
    </div>
  );
}

export default ZiweiChart;
