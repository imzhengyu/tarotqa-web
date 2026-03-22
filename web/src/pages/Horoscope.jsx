import { useState, useEffect, useCallback } from 'react';
import MarkdownIt from 'markdown-it';
import markdownitMark from 'markdown-it-mark';
import DOMPurify from 'dompurify';
import dayjs from 'dayjs';
import api from '../services/api';
import { useAIRequestCooldown } from '../hooks/useAIRequestCooldown';
import './Horoscope.css';

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

md.use(markdownitMark);
md.enable('table');

const zodiacList = [
  { id: 'aries', name: '白羊座', symbol: '♈', element: '火' },
  { id: 'taurus', name: '金牛座', symbol: '♉', element: '土' },
  { id: 'gemini', name: '双子座', symbol: '♊', element: '风' },
  { id: 'cancer', name: '巨蟹座', symbol: '♋', element: '水' },
  { id: 'leo', name: '狮子座', symbol: '♌', element: '火' },
  { id: 'virgo', name: '处女座', symbol: '♍', element: '土' },
  { id: 'libra', name: '天秤座', symbol: '♎', element: '风' },
  { id: 'scorpio', name: '天蝎座', symbol: '♏', element: '水' },
  { id: 'sagittarius', name: '射手座', symbol: '♐', element: '火' },
  { id: 'capricorn', name: '摩羯座', symbol: '♑', element: '土' },
  { id: 'aquarius', name: '水瓶座', symbol: '♒', element: '风' },
  { id: 'pisces', name: '双鱼座', symbol: '♓', element: '水' },
];

function Horoscope() {
  const [selected, setSelected] = useState('aries');
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const { aiCooldown, showCooldownToast, startCooldownTimer, startCooldown } = useAIRequestCooldown('ai_horoscope_cooldown_end');

  const loadHoroscope = useCallback(async (zodiac) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHoroscope(zodiac);
      setHoroscope(data);
    } catch (err) {
      console.error('Failed to load horoscope:', err);
      setError('加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHoroscope(selected);
    startCooldownTimer();
  }, [selected, loadHoroscope, startCooldownTimer]);

  const handleAIInterpretation = async () => {
    if (aiLoading || aiCooldown > 0) return;

    const selectedZodiac = zodiacList.find(z => z.id === selected);
    if (!selectedZodiac) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const currentDate = {
        year: dayjs().year(),
        month: dayjs().month() + 1,
        day: dayjs().date()
      };
      const interpretation = await api.getAIHoroscope(selected, selectedZodiac.name, currentDate);
      startCooldown();
      setAiInterpretation(interpretation);
    } catch (error) {
      console.error('[AI运势] 捕获错误:', error.message);
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
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'del', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'mark'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'style']
      });
      return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: clean }} />;
    } catch (error) {
      console.error('[Markdown渲染] 解析失败:', error);
      return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</pre>;
    }
  };

  return (
    <div className="horoscope">
      {showCooldownToast && aiCooldown > 0 && (
        <div className="cooldown-toast">
          <span className="cooldown-icon">⏳</span>
          <span className="cooldown-text">请等待 {aiCooldown}s 后再试</span>
        </div>
      )}

      <h1 className="page-title">每日运势</h1>

      <div className="zodiac-selector">
        {zodiacList.map(z => (
          <button
            key={z.id}
            className={`zodiac-btn ${selected === z.id ? 'active' : ''}`}
            onClick={() => setSelected(z.id)}
          >
            <span className="zodiac-symbol">{z.symbol}</span>
            <span className="zodiac-name">{z.name}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => loadHoroscope(selected)}>
            重试
          </button>
        </div>
      ) : horoscope ? (
        <div className="horoscope-content">
          <div className="horoscope-header">
            <h2>{horoscope.name}</h2>
          </div>

          <div className="horoscope-grid">
            <div className="horoscope-card overall">
              <h3>综合运势</h3>
              <p>{horoscope.overall}</p>
            </div>
            <div className="horoscope-card love">
              <h3>爱情运势</h3>
              <p>{horoscope.love}</p>
            </div>
            <div className="horoscope-card career">
              <h3>事业运势</h3>
              <p>{horoscope.career}</p>
            </div>
            <div className="horoscope-card finance">
              <h3>财运</h3>
              <p>{horoscope.finance}</p>
            </div>
          </div>

          <div className="lucky-info">
            <div className="lucky-item">
              <span className="lucky-label">幸运数字</span>
              <span className="lucky-value">{horoscope.luckyNumber}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-label">幸运颜色</span>
              <span className="lucky-value">{horoscope.luckyColor}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-label">幸运方向</span>
              <span className="lucky-value">{horoscope.luckyDirection}</span>
            </div>
          </div>

          <div className="ai-action">
            <button
              className="btn btn-primary"
              onClick={handleAIInterpretation}
              disabled={aiLoading || aiCooldown > 0}
            >
              {aiLoading ? '分析中...' : aiCooldown > 0 ? `请等待 ${aiCooldown}s` : 'AI运势分析'}
            </button>
          </div>

          {aiError && (
            <div className="ai-error">
              <p>错误: {aiError}</p>
              <button onClick={() => setAiError(null)}>关闭</button>
            </div>
          )}

          {aiInterpretation && (
            <div className="ai-interpretation">
              <h3>AI 运势分析</h3>
              {renderMarkdownContent(aiInterpretation)}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default Horoscope;
