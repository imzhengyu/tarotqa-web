import { useState, useEffect } from 'react';
import MarkdownIt from 'markdown-it';
import markdownitMark from 'markdown-it-mark';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import DOMPurify from 'dompurify';
import TarotCard from '../components/TarotCard';
import DisclaimerModal from '../components/common/DisclaimerModal';
import DelayedPoofButton from '../components/common/DelayedPoofButton';
import { StarIcon, SparkleEffect, OrbGlow } from '../components/common/DecorativeElements';
import { useLanguage } from '../context/LanguageContext';
import { exportToPNG } from '../utils/export';
import { formatTimestamp } from '../utils/date';
import api from '../services/api';
import { spreads } from '../data/spreads';
import useVisitStats from '../hooks/useVisitStats';
import { useAIRequestCooldown } from '../hooks/useAIRequestCooldown';
import { useBackToTop } from '../hooks/useBackToTop';
import { UI_LIMITS, TIMING } from '../constants';
import './Divination.css';

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

md.use(markdownitMark);

md.use(markdownItMultimdTable, {
  multiline: true,
  header: true
});

const generateTarotFilename = (spreadName, cardCount) => {
  const safeSpreadName = spreadName?.replace(/\s+/g, '-') || 'reading';
  return `tarot-${safeSpreadName}-${cardCount}cards-${formatTimestamp()}`;
};

const spreadList = Object.values(spreads).map(s => ({
  id: s.id,
  name: s.name,
  nameEn: s.nameEn,
  cards: s.cardCount,
  desc: s.description,
  descEn: s.descriptionEn,
  positions: s.positions.map(p => ({ name: p.name, nameEn: p.nameEn }))
}));

function Divination() {
  const [cards, setCards] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [selectedSpread, setSelectedSpread] = useState(null);
  const [step, setStep] = useState('select');
  const [question, setQuestion] = useState('');
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [drawnCards, setDrawnCards] = useState([]);
  const [currentDrawIndex, setCurrentDrawIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiRequestDuration, setAiRequestDuration] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [dealingCard, setDealingCard] = useState(null);
  const { showBackToTop, scrollToTop } = useBackToTop();

  // Visit stats tracking
  const { incrementQuestionCount } = useVisitStats();

  const { aiCooldown, showCooldownToast, canMakeAIRequest, startCooldownTimer, startCooldown } = useAIRequestCooldown('ai_cooldown_end');

  // Language context
  const { language, t } = useLanguage();

  useEffect(() => {
    loadCards();
    startCooldownTimer();
  }, [startCooldownTimer]);

  const loadCards = async () => {
    try {
      const data = await api.getCards();
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const shuffleDeck = () => {
    const deck = [...cards].sort(() => Math.random() - 0.5);
    setShuffledDeck(deck);
    return deck;
  };

  const handleSelectSpread = (spread) => {
    setSelectedSpread(spread);
  };

  const handleStartQuestion = () => {
    if (!question.trim()) {
      alert(t('请描述您的问题', 'Please describe your question'));
      return;
    }
    shuffleDeck();
    setDrawnCards([]);
    setCurrentDrawIndex(0);
    setIsShuffling(true);
    setTimeout(() => {
      setIsShuffling(false);
      setStep('draw');
    }, 800);
  };

  const handleDrawCard = () => {
    if (currentDrawIndex >= selectedSpread.cards) return;

    const card = shuffledDeck[currentDrawIndex];
    // 50% 概率正位或逆位
    const isReversed = Math.random() < 0.5;
    const newCard = { ...card, position: currentDrawIndex, isReversed };

    // Start dealing animation
    setDealingCard(newCard);

    // After animation completes, add card to drawnCards
    setTimeout(() => {
      setDrawnCards([...drawnCards, newCard]);
      setDealingCard(null);
      setCurrentDrawIndex(currentDrawIndex + 1);

      if (currentDrawIndex + 1 >= selectedSpread.cards) {
        setStep('reveal');
      }
    }, 500);
  };

  const handleReset = () => {
    setSelectedSpread(null);
    setQuestion('');
    setShuffledDeck([]);
    setDrawnCards([]);
    setCurrentDrawIndex(0);
    setStep('select');
    setAiInterpretation(null);
    setAiError(null);
    setLastRequest(null);
    setIsShuffling(false);
    setDealingCard(null);
  };

  const handleAIInterpretation = async () => {
    // 检查速率限制
    if (!canMakeAIRequest()) {
      const endTime = localStorage.getItem('ai_cooldown_end');
      const remaining = endTime ? Math.max(0, Math.ceil((parseInt(endTime, 10) - Date.now()) / 1000)) : 0;
      setAiError(`请等待 ${remaining} 秒后再试`);
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiRequestDuration(null);

    const requestStartTime = Date.now();

    // 获取将使用的角色
    const persona = api.getRecommendedPersona(selectedSpread?.id, question);

    // 记录请求信息用于调试
    const requestInfo = {
      timestamp: new Date().toISOString(),
      spread: selectedSpread?.name,
      cardCount: drawnCards.length,
      question: question || '(无问题)',
      persona: persona.name
    };
    setLastRequest(requestInfo);

    try {
      const interpretation = await api.getAIInterpretation({
        question,
        selectedSpread,
        drawnCards,
        language
      });
      startCooldown();
      const duration = Date.now() - requestStartTime;
      setAiRequestDuration(duration);
      setAiInterpretation(interpretation);
      // Update debug info with raw AI response
      setLastRequest(prev => prev ? { ...prev, aiRawResponse: interpretation } : null);
      // Increment question count for visit stats
      incrementQuestionCount();
    } catch (error) {
      console.error('[AI解读] 捕获错误:', error.message);
      startCooldown();
      const duration = Date.now() - requestStartTime;
      setAiRequestDuration(duration);
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  // 渲染 Markdown 内容（使用 markdown-it + DOMPurify 净化）
  const renderMarkdownContent = (content) => {
    if (!content) return '';

    try {
      const html = md.render(content);
      // 使用 DOMPurify 净化 HTML，防止 XSS 注入
      const clean = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'strong', 'em', 'del', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'mark'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel', 'style']
      });
      return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: clean }} />;
    } catch (error) {
      console.error('[Markdown渲染] 解析失败:', error);
      // 降级渲染：直接显示原始内容
      return <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</pre>;
    }
  };

  // 解析 AI 回复为分节格式（简化为直接返回整个内容）
  const parseInterpretation = (text) => {
    if (!text || typeof text !== 'string') {
      return [{ title: t('综合解读', 'Comprehensive Analysis'), icon: '📖', content: String(text || '') }];
    }

    // 直接将整个文本作为一个 section 返回，由 Markdown 渲染处理格式
    return [{ title: t('综合解读', 'Comprehensive Analysis'), icon: '📖', content: text }];
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="divination">
      {/* 冷却倒计时浮动提示 */}
      {showCooldownToast && aiCooldown > 0 && (
        <div className="cooldown-toast">
          <span className="cooldown-icon">⏳</span>
          <span className="cooldown-text">{t(`请等待 ${aiCooldown}s 后再试`, `Please wait ${aiCooldown}s`)}</span>
        </div>
      )}

      {/* 回到顶部浮动按钮 */}
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title={t('回到顶部', 'Back to Top')} data-tooltip={t('回到顶部', 'Back to Top')}>
          <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10.5v10.5h14V10.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}

      <h1 className="page-title">{t('占卜', 'Divination')}</h1>

      {step === 'select' && (
        <section className="spread-select">
          <h2>{t('选择牌阵', 'Select a Spread')}</h2>
          <div className="spreads-list">
            {spreadList.map(spread => (
              <div
                key={spread.id}
                className={`spread-item ${selectedSpread?.id === spread.id ? 'selected' : ''}`}
                onClick={() => handleSelectSpread(spread)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectSpread(spread);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <h3>{language === 'zh' ? spread.name : spread.nameEn}</h3>
                <p>{language === 'zh' ? spread.desc : spread.descEn}</p>
                <span className="spread-count">{spread.cards} {t('张牌', 'cards')}</span>
              </div>
            ))}
          </div>
          <div className="action-bar">
            <DelayedPoofButton
              className="btn btn-primary"
              onClick={() => setStep('question')}
              disabled={!selectedSpread}
            >
              {selectedSpread ? t('选择此牌阵 →', 'Select This Spread →') : t('请先选择牌阵', 'Please Select a Spread First')}
            </DelayedPoofButton>
          </div>
        </section>
      )}

      {step === 'question' && (
        <section className="question-input">
          <h2>{t('描述您的问题', 'Describe Your Question')}</h2>
          <div className="textarea-wrapper">
            <textarea
              className="question-textarea"
              placeholder={t('请描述您想要咨询的问题...', 'Please describe the question you want to ask...')}
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, UI_LIMITS.MAX_QUESTION_LENGTH))}
              rows={4}
              maxLength={UI_LIMITS.MAX_QUESTION_LENGTH}
            />
            <div className="textarea-hint">
              <span className={`char-count ${question.length >= UI_LIMITS.QUESTION_WARNING_THRESHOLD ? 'warning' : ''} ${question.length >= UI_LIMITS.MAX_QUESTION_LENGTH ? 'error' : ''}`}>
                {question.length} / {UI_LIMITS.MAX_QUESTION_LENGTH}
              </span>
            </div>
          </div>
          <div className="deck-area">
            <div
              className={`deck ${isShuffling ? 'shuffling' : ''}`}
            >
              <TarotCard faceUp={false} shuffling={isShuffling} />
            </div>
            <p className="draw-hint">{isShuffling ? t('洗牌中...', 'Shuffling...') : t('准备开始抽牌', 'Ready to Draw')}</p>
          </div>
          <div className="action-bar">
            <DelayedPoofButton className="btn btn-secondary" onClick={() => setStep('select')}>
              {t('返回', 'Back')}
            </DelayedPoofButton>
            <DelayedPoofButton className="btn btn-primary" onClick={handleStartQuestion} disabled={isShuffling}>
              {isShuffling ? t('洗牌中...', 'Shuffling...') : t('开始抽牌', 'Start Drawing')}
            </DelayedPoofButton>
          </div>
        </section>
      )}

      {step === 'draw' && (
        <section className="draw-cards">
          <h2>{t(`请选择 ${selectedSpread.name}`, `Please Select ${selectedSpread.name}`)}</h2>
          <p className="draw-progress">
            {t(`第 ${drawnCards.length + 1} / ${selectedSpread.cards} 张`, `Card ${drawnCards.length + 1} of ${selectedSpread.cards}`)}
          </p>

          <div className="deck-area">
            <div
              className={`deck ${isShuffling ? 'shuffling' : ''}`}
              onClick={!isShuffling ? handleDrawCard : undefined}
              onKeyDown={(e) => {
                if (!isShuffling && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleDrawCard();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TarotCard faceUp={false} shuffling={isShuffling} />
            </div>
            <p className="draw-hint">{isShuffling ? t('洗牌中...', 'Shuffling...') : t('点击卡牌抽取', 'Click to Draw')}</p>
          </div>

          {drawnCards.length > 0 && (
            <div className="drawn-cards">
              <h3>{t('已抽取的牌', 'Drawn Cards')}</h3>
              <div className="drawn-list">
                {drawnCards.map((card, idx) => (
                  <div key={idx} className="drawn-item">
                    <TarotCard card={card} faceUp={true} small />
                    <span className="drawn-position">{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dealing animation overlay */}
          {dealingCard && (
            <div className="dealing-overlay">
              <TarotCard card={dealingCard} faceUp={true} />
            </div>
          )}

          <div className="action-bar">
            <DelayedPoofButton className="btn btn-secondary" onClick={handleReset}>
              {t('重新开始', 'Start Over')}
            </DelayedPoofButton>
          </div>
        </section>
      )}

      {step === 'reveal' && (
        <section className="result">
          <h2>{t('占卜结果', 'Divination Result')}</h2>

          <div className="result-cards">
            {drawnCards.map((card, idx) => (
              <div key={idx} className="result-card">
                <TarotCard card={card} faceUp={true} />
                <div className="result-card-info">
                  <h4>{language === 'zh' ? selectedSpread.positions?.[idx]?.name : selectedSpread.positions?.[idx]?.nameEn || `${language === 'zh' ? '位置' : 'Position'} ${idx + 1}`}</h4>
                  <span className={`card-position-type ${card.isReversed ? 'reversed' : 'upright'}`}>
                    {card.isReversed ? t('逆位', 'Reversed') : t('正位', 'Upright')}
                  </span>
                  <p className="card-meaning">
                    {card.isReversed ? card.reversedDescription : card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="result-actions">
            <DelayedPoofButton className="btn btn-secondary" onClick={() => setStep('question')}>
              {t('重新问题', 'New Question')}
            </DelayedPoofButton>
            <button
              className="btn btn-primary"
              onClick={handleAIInterpretation}
              disabled={aiLoading || aiCooldown > 0}
            >
              {aiCooldown > 0
                ? `${t('请等待', 'Wait')} ${aiCooldown}s`
                : aiLoading
                  ? t('解读中...', 'Analyzing...')
                  : t('AI深度解读', 'AI Deep Analysis')}
            </button>
          </div>

          {aiError && (
            <div className="ai-error">
              <p>{t('错误: ', 'Error: ')}{aiError}</p>
              <button onClick={() => setAiError(null)}>{t('关闭', 'Close')}</button>
            </div>
          )}

          {aiInterpretation && (
            <>
              <div className="ai-interpretation" id="divination-ai-result">
                <div className="interpretationDecorations">
                  <OrbGlow size={100} className="interpOrb orbLeft" />
                  <OrbGlow size={80} className="interpOrb orbRight" />
                  <StarIcon size={20} className="interpStar starLeft1" />
                  <StarIcon size={16} className="interpStar starLeft2" />
                  <StarIcon size={18} className="interpStar starRight1" />
                  <StarIcon size={14} className="interpStar starRight2" />
                  <SparkleEffect size={50} intensity={0.6} className="interpSparkle sparkleLeft" />
                  <SparkleEffect size={40} intensity={0.4} className="interpSparkle sparkleRight" />
                </div>
                <h3>
                  {t('AI 深度解读', 'AI Deep Analysis')}
                  {aiRequestDuration !== null && (
                    <span className="ai-duration">⏱️ {Math.floor(aiRequestDuration / TIMING.DURATION_HOUR_MS).toString().padStart(2, '0')}:{Math.floor((aiRequestDuration % TIMING.DURATION_HOUR_MS) / TIMING.DURATION_MINUTE_MS).toString().padStart(2, '0')}:{(aiRequestDuration % TIMING.DURATION_MINUTE_MS / 1000).toFixed(0).padStart(2, '0')}</span>
                  )}
                </h3>

                <div className="interpretation-question">
                  <div className="question-label">
                    <span>❓</span>
                    <span>{t('您的提问', 'Your Question')}</span>
                </div>
                <p className="question-text">&ldquo;{question || t('无特定问题，希望了解整体运势', 'No specific question, hoping to learn about overall fortune')}&rdquo;</p>
                <p className="question-meta">
                  {t(`牌阵：${selectedSpread?.name} | 抽牌：${drawnCards.length}张`, `Spread: ${selectedSpread?.name} | Cards: ${drawnCards.length}`)}
                </p>
              </div>

              <div className="interpretation-sections">
                {parseInterpretation(aiInterpretation).map((section, idx) => (
                  <div key={idx} className="interpretation-section">
                    <div className="interpretation-section-title">
                      <span>{section.icon || '📖'}</span>
                      <span>{section.title || t('综合解读', 'Comprehensive Analysis')}</span>
                    </div>
                    <div className="interpretation-section-content">
                      {renderMarkdownContent(section.content || '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
              <div className="ai-export-section">
                <button
                  className="btn btn-secondary export-ai-btn"
                  onClick={() => exportToPNG('divination-ai-result', generateTarotFilename(selectedSpread?.name, drawnCards.length))}
                  title={t('输出PNG图片', 'Export as PNG')}
                >
                  📥 {t('导出分析结果', 'Export Analysis')}
                </button>
              </div>
            </>
          )}

          {/* Debug 信息面板 */}
          {(debugMode && lastRequest) && (
            <div className="debug-panel">
              <h4>{t('调试信息', 'Debug Info')}</h4>
              <p><strong>{t('请求时间:', 'Request Time:')}</strong> {lastRequest.timestamp}</p>
              <p><strong>{t('牌阵:', 'Spread:')}</strong> {lastRequest.spread}</p>
              <p><strong>{t('角色:', 'Persona:')}</strong> {lastRequest.persona}</p>
              <p><strong>{t('卡牌数:', 'Card Count:')}</strong> {lastRequest.cardCount}</p>
              <p><strong>{t('问题:', 'Question:')}</strong> {lastRequest.question}</p>
              <details>
                <summary style={{ cursor: 'pointer', color: 'var(--color-secondary)' }}>{t('完整请求数据', 'Full Request Data')}</summary>
                <pre>{JSON.stringify(lastRequest, null, 2)}</pre>
              </details>
              <details>
                <summary style={{ cursor: 'pointer', color: 'var(--color-secondary)' }}>{t('抽卡详情', 'Card Details')}</summary>
                <pre>{JSON.stringify(drawnCards.map(c => ({
                  id: c.id,
                  name: c.name,
                  isReversed: c.isReversed,
                  position: c.position
                })), null, 2)}</pre>
              </details>
              {lastRequest.aiRawResponse && (
                <details>
                  <summary style={{ cursor: 'pointer', color: 'var(--color-secondary)' }}>{t('AI 原始回复', 'AI Raw Response')}</summary>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {lastRequest.aiRawResponse}
                  </pre>
                </details>
              )}
            </div>
          )}

          <label className="debug-toggle">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
            />
            {t('显示调试信息', 'Show Debug Info')}
          </label>

          <div className="action-bar" style={{ marginTop: '20px' }}>
            <DelayedPoofButton className="btn btn-secondary" onClick={handleReset}>
              {t('重新占卜', 'Divine Again')}
            </DelayedPoofButton>
          </div>
        </section>
      )}

      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        type="tarot"
      />
    </div>
  );
}

export default Divination;