import PropTypes from 'prop-types';
import { Iztrolabe } from 'react-iztro';
import MarkdownSection from '../../components/common/MarkdownSection';
import Icon from '../../components/common/Icons';
import { exportMarkdownToPdf } from '../../utils/exportPdf';

const markdownPlugins = [
  { loader: () => import('markdown-it-multimd-table'), options: { multiline: true, header: true } }
];

export default function ZiweiChartDisplay({
  birthData,
  birthdayStr,
  horoscopeDate,
  aiInterpretation,
  aiError,
  aiLoading,
  aiCooldown,
  onAnalyze,
  onClearError,
  generateFilename,
  t
}) {
  return (
    <div className="ziwei-chart-section">
      {birthData ? (
        <>
          <div className="chartWrapper">
            <div className="chart-container">
              <Iztrolabe
                birthday={birthdayStr}
                birthTime={Math.floor(birthData.hour / 2) % 12}
                birthdayType="solar"
                gender={birthData.gender}
                horoscopeDate={horoscopeDate}
              />
            </div>
          </div>
          <div className="ai-action">
            <button
              className="btn btn-secondary"
              onClick={onAnalyze}
              disabled={aiLoading || aiCooldown > 0}
            >
              {aiLoading ? t('分析中...', 'Analyzing...') : aiCooldown > 0 ? `${t('请等待', 'Wait')} ${aiCooldown}s` : t('AI 命盘分析', 'AI Chart Analysis')}
            </button>
          </div>
        </>
      ) : (
        <div className="chart-placeholder">
          <div className="placeholder-icon">🀄</div>
          <p>{t('点击生成命盘', 'Click Generate Chart')}</p>
        </div>
      )}

      {(aiInterpretation || aiError) && (
        <div className="ziwei-ai-section">
          {aiError && (
            <div className="ai-error">
              <p>{t('错误: ', 'Error: ')}{aiError}</p>
              <button onClick={onClearError}>{t('关闭', 'Close')}</button>
            </div>
          )}
          {aiInterpretation && (
            <>
              <div className="ai-interpretation" id="ziwei-ai-result">
                <h3>{t('AI 命盘分析', 'AI Chart Analysis')}</h3>
                <MarkdownSection content={aiInterpretation} plugins={markdownPlugins} />
              </div>
              <div className="ai-export-section">
                <button
                  className="btn btn-secondary export-ai-btn"
                  onClick={() => exportMarkdownToPdf(aiInterpretation, generateFilename(birthData), {
                    title: t('紫微斗数 · AI 解读', 'Ziwei Dou Shu · AI Analysis'),
                    subtitle: birthData ? `${birthData.year}-${String(birthData.month).padStart(2, '0')}-${String(birthData.day).padStart(2, '0')}` : ''
                  })}
                  title={t('导出 PDF', 'Export as PDF')}
                >
                  <Icon name="download" size={16} /> {t('导出 PDF', 'Export as PDF')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

ZiweiChartDisplay.propTypes = {
  birthData: PropTypes.object,
  birthdayStr: PropTypes.string,
  horoscopeDate: PropTypes.instanceOf(Date),
  aiInterpretation: PropTypes.string,
  aiError: PropTypes.string,
  aiLoading: PropTypes.bool,
  aiCooldown: PropTypes.number,
  onAnalyze: PropTypes.func.isRequired,
  onClearError: PropTypes.func.isRequired,
  generateFilename: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
};
