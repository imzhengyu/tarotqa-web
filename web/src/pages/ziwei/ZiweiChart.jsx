import { useState, useCallback } from 'react';
import MarkdownIt from 'markdown-it';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import DOMPurify from 'dompurify';
import { Iztrolabe } from 'react-iztro';
import BirthInfoForm from '../../components/common/BirthInfoForm';
import DisclaimerModal from '../../components/common/DisclaimerModal';
import DelayedPoofButton from '../../components/common/DelayedPoofButton';
import { StarIcon, SparkleEffect, OrbGlow } from '../../components/common/DecorativeElements';
import { useAIRequestCooldown } from '../../hooks/useAIRequestCooldown';
import { useBackToTop } from '../../hooks/useBackToTop';
import { useDevice } from '../../hooks/useDevice';
import { generateZiweiData, formatZiweiPrompt } from '../../utils/ziwei/ziweiData';
import { useLanguage } from '../../context/LanguageContext';
import { exportToPNG } from '../../utils/export';
import { formatTimestamp } from '../../utils/date';
import api from '../../services/api';
import './ZiweiChart.css';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
}).use(markdownItMultimdTable, {
  multiline: true,
  header: true
});

const generateZiweiFilename = (birthData) => {
  if (!birthData) return `ziwei-${formatTimestamp()}`;
  const { year, month, day, hour, minute } = birthData;
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${year}${pad(month)}${pad(day)}`;
  const timeStr = `${pad(hour)}${pad(minute)}`;
  return `ziwei-${dateStr}_${timeStr}-${formatTimestamp()}`;
};

function ZiweiChart() {
  const { language, t } = useLanguage();
  const { deviceType } = useDevice();
  const [birthData, setBirthData] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [chartGenerated, setChartGenerated] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const { showBackToTop, scrollToTop } = useBackToTop();

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

      const ziweiData = generateZiweiData(birthdayStr, birthData.hour, birthData.gender, 'solar');
      const ziweiPrompt = formatZiweiPrompt(ziweiData);

      const interpretation = await api.getAIZiweiInterpretation({
        birthday: birthdayStr,
        birthTime: birthData.hour,
        gender: birthData.gender,
        birthdayType: 'solar',
        ziweiData: ziweiPrompt,
        language
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
    <div className={`ziwei-chart-page layout-${deviceType}`}>
      {showCooldownToast && aiCooldown > 0 && (
        <div className="cooldown-toast">
          <span className="cooldown-icon">⏳</span>
          <span className="cooldown-text">{language === 'zh' ? `请等待 ${aiCooldown}s 后再试` : `Please wait ${aiCooldown}s`}</span>
        </div>
      )}

      <h1 className="page-title">{t('紫微斗数排盘', 'Ziwei Dou Shu Chart')}</h1>

      {/* 第一行：出生信息 */}
      <div className="ziwei-form-section">
        <div className="form-card">
          <h2>{t('出生信息', 'Birth Information')}</h2>
          <BirthInfoForm
            value={birthData}
            onChange={handleBirthDataChange}
            showGender={true}
          />
          <DelayedPoofButton
            className="btn btn-primary generate-btn"
            onClick={handleGenerateChart}
            disabled={!birthData}
          >
            {t('生成命盘', 'Generate Chart')}
          </DelayedPoofButton>
        </div>
      </div>

      {/* 第二行：命盘输出 */}
      <div className="ziwei-chart-section">
        {chartGenerated && birthData ? (
          <>
            <div className="chartWrapper">
              <div className="chartDecorations">
                <OrbGlow size={80} className="chartOrb orbLeft" />
                <OrbGlow size={60} className="chartOrb orbRight" />
                <StarIcon size={18} className="chartStar star1" />
                <StarIcon size={14} className="chartStar star2" />
                <StarIcon size={16} className="chartStar star3" />
                <SparkleEffect size={45} intensity={0.5} className="chartSparkle" />
              </div>
              <div className="chart-container">
                <Iztrolabe
                  birthday={formatBirthday()}
                  birthTime={Math.floor(birthData.hour / 2) % 12}
                  birthdayType="solar"
                  gender={birthData.gender}
                  horoscopeDate={new Date()}
                />
              </div>
            </div>
            {birthData && (
              <div className="ai-action">
                <button
                  className="btn btn-secondary"
                  onClick={handleAIInterpretation}
                  disabled={aiLoading || aiCooldown > 0}
                >
                  {aiLoading ? t('分析中...', 'Analyzing...') : aiCooldown > 0 ? `${t('请等待', 'Wait')} ${aiCooldown}s` : t('AI 命盘分析', 'AI Chart Analysis')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="chart-placeholder">
            <div className="placeholder-icon">🀄</div>
            <p>{t('点击生成命盘', 'Click Generate Chart')}</p>
          </div>
        )}

        {aiError && !chartGenerated && (
          <div className="ai-error">
            <p>{t('错误: ', 'Error: ')}{aiError}</p>
            <button onClick={() => setAiError(null)}>{t('关闭', 'Close')}</button>
          </div>
        )}
      </div>

      {(aiInterpretation || aiError) && (
        <div className="ziwei-ai-section">
          {aiError && (
            <div className="ai-error">
              <p>{t('错误: ', 'Error: ')}{aiError}</p>
              <button onClick={() => setAiError(null)}>{t('关闭', 'Close')}</button>
            </div>
          )}
          {aiInterpretation && (
            <>
              <div className="ai-interpretation" id="ziwei-ai-result">
                <h3>{t('AI 命盘分析', 'AI Chart Analysis')}</h3>
                {renderMarkdownContent(aiInterpretation)}
              </div>
              <div className="ai-export-section">
                <button
                  className="btn btn-secondary export-ai-btn"
                  onClick={() => exportToPNG('ziwei-ai-result', generateZiweiFilename(birthData))}
                  title={t('输出PNG图片', 'Export as PNG')}
                >
                  📥 {t('导出分析结果', 'Export Analysis')}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        type="ziwei"
      />
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title={t('回到顶部', 'Back to Top')} data-tooltip={t('回到顶部', 'Back to Top')}>
          <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10.5v10.5h14V10.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

export default ZiweiChart;
