import { useState, useCallback, useMemo } from 'react';
import DisclaimerModal from '../../components/common/DisclaimerModal';
import { useAIRequestCooldown } from '../../hooks/useAIRequestCooldown';
import { useBackToTop } from '../../hooks/useBackToTop';
import { useDevice } from '../../hooks/useDevice';
import { generateZiweiData, formatZiweiPrompt } from '../../utils/ziwei/ziweiData';
import { useLanguage } from '../../context/LanguageContext';
import { formatTimestamp } from '../../utils/date';
import api from '../../services/api';
import ZiweiChartForm from './ZiweiChartForm';
import ZiweiChartDisplay from './ZiweiChartDisplay';
import './ZiweiChart.css';

export const generateZiweiFilename = (birthData) => {
  if (!birthData) return `ziwei-${formatTimestamp()}`;
  const { year, month, day, hour, minute } = birthData;
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = `${year}${pad(month)}${pad(day)}`;
  const timeStr = `${pad(hour)}${pad(minute)}`;
  return `ziwei-${dateStr}_${timeStr}-${formatTimestamp()}`;
};

export const formatBirthday = (birthData) => {
  if (!birthData) return '';
  return `${birthData.year}-${String(birthData.month).padStart(2, '0')}-${String(birthData.day).padStart(2, '0')}`;
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

  const handleAIInterpretation = useCallback(async () => {
    if (aiLoading || aiCooldown > 0 || !birthData) return;

    setAiInterpretation(null);
    setAiLoading(true);
    setAiError(null);

    try {
      const birthdayStr = formatBirthday(birthData);

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
  }, [aiCooldown, aiLoading, birthData, language, startCooldown]);

  const birthdayStr = useMemo(() => formatBirthday(birthData), [birthData]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const horoscopeDate = useMemo(() => new Date(), [chartGenerated]);

  return (
    <div className={`ziwei-chart-page layout-${deviceType}`}>
      {showCooldownToast && aiCooldown > 0 && (
        <div className="cooldown-toast">
          <span className="cooldown-icon">⏳</span>
          <span className="cooldown-text">{language === 'zh' ? `请等待 ${aiCooldown}s 后再试` : `Please wait ${aiCooldown}s`}</span>
        </div>
      )}

      <h1 className="page-title">{t('紫微斗数排盘', 'Ziwei Dou Shu Chart')}</h1>

      <ZiweiChartForm
        birthData={birthData}
        onChange={handleBirthDataChange}
        onGenerate={handleGenerateChart}
        t={t}
      />

      <ZiweiChartDisplay
        birthData={birthData}
        birthdayStr={birthdayStr}
        horoscopeDate={horoscopeDate}
        aiInterpretation={aiInterpretation}
        aiError={aiError}
        aiLoading={aiLoading}
        aiCooldown={aiCooldown}
        onAnalyze={handleAIInterpretation}
        onClearError={() => setAiError(null)}
        generateFilename={generateZiweiFilename}
        t={t}
      />

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
