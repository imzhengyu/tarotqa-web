import { useState, useEffect } from 'react';
import MarkdownIt from 'markdown-it';
import markdownitMark from 'markdown-it-mark';
import DOMPurify from 'dompurify';
import TarotCard from '../components/TarotCard';
import api from '../services/api';
import { spreads } from '../data/spreads';
import useVisitStats from '../hooks/useVisitStats';
import { useAIRequestCooldown } from '../hooks/useAIRequestCooldown';
import './Divination.css';

// 创建 markdown-it 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// 添加扩展语法：==高亮==
md.use(markdownitMark);

// 启用表格支持
md.enable('table');

// 转换为 Divination 组件期望的格式
const spreadList = Object.values(spreads).map(s => ({
  id: s.id,
  name: s.name,
  cards: s.cardCount,
  desc: s.description,
  positions: s.positions.map(p => ({ name: p.name }))
}));

function Divination() {
  const [cards, setCards] = useState([]);
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
  const [debugMode, setDebugMode] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);

  // Visit stats tracking
  const { incrementQuestionCount } = useVisitStats();

  const { aiCooldown, showCooldownToast, canMakeAIRequest, startCooldownTimer, startCooldown } = useAIRequestCooldown('ai_cooldown_end');

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
      alert('请描述您的问题');
      return;
    }
    shuffleDeck();
    setDrawnCards([]);
    setCurrentDrawIndex(0);
    setStep('draw');
  };

  const handleDrawCard = () => {
    if (currentDrawIndex >= selectedSpread.cards) return;

    const card = shuffledDeck[currentDrawIndex];
    // 50% 概率正位或逆位
    const isReversed = Math.random() < 0.5;
    setDrawnCards([...drawnCards, { ...card, position: currentDrawIndex, isReversed }]);
    setCurrentDrawIndex(currentDrawIndex + 1);

    if (currentDrawIndex + 1 >= selectedSpread.cards) {
      setStep('reveal');
    }
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
        drawnCards
      });
      startCooldown();
      setAiInterpretation(interpretation);
      // Update debug info with raw AI response
      setLastRequest(prev => prev ? { ...prev, aiRawResponse: interpretation } : null);
      // Increment question count for visit stats
      incrementQuestionCount();
    } catch (error) {
      console.error('[AI解读] 捕获错误:', error.message);
      startCooldown();
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
      return [{ title: '综合解读', icon: '📖', content: String(text || '') }];
    }

    // 直接将整个文本作为一个 section 返回，由 Markdown 渲染处理格式
    return [{ title: '综合解读', icon: '📖', content: text }];
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
          <span className="cooldown-text">请等待 {aiCooldown}s 后再试</span>
        </div>
      )}

      <h1 className="page-title">占卜</h1>

      {step === 'select' && (
        <section className="spread-select">
          <h2>选择牌阵</h2>
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
                <h3>{spread.name}</h3>
                <p>{spread.desc}</p>
                <span className="spread-count">{spread.cards}张牌</span>
              </div>
            ))}
          </div>
          <div className="action-bar">
            <button
              className="btn btn-primary"
              onClick={() => setStep('question')}
              disabled={!selectedSpread}
            >
              {selectedSpread ? '选择此牌阵 →' : '请先选择牌阵'}
            </button>
          </div>
        </section>
      )}

      {step === 'question' && (
        <section className="question-input">
          <h2>描述您的问题</h2>
          <div className="textarea-wrapper">
            <textarea
              className="question-textarea"
              placeholder="请描述您想要咨询的问题..."
              value={question}
              onChange={(e) => setQuestion(e.target.value.slice(0, 1500))}
              rows={4}
              maxLength={1500}
            />
            <div className="textarea-hint">
              <span className={`char-count ${question.length >= 1400 ? 'warning' : ''} ${question.length >= 1500 ? 'error' : ''}`}>
                {question.length} / 1500
              </span>
            </div>
          </div>
          <div className="action-bar">
            <button className="btn btn-secondary" onClick={() => setStep('select')}>
              返回
            </button>
            <button className="btn btn-primary" onClick={handleStartQuestion}>
              开始抽牌
            </button>
          </div>
        </section>
      )}

      {step === 'draw' && (
        <section className="draw-cards">
          <h2>请选择 {selectedSpread.name}</h2>
          <p className="draw-progress">
            第 {drawnCards.length + 1} / {selectedSpread.cards} 张
          </p>

          <div className="deck-area">
            <div
              className="deck"
              onClick={handleDrawCard}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDrawCard();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TarotCard faceUp={false} />
            </div>
            <p className="draw-hint">点击卡牌抽取</p>
          </div>

          {drawnCards.length > 0 && (
            <div className="drawn-cards">
              <h3>已抽取的牌</h3>
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

          <div className="action-bar">
            <button className="btn btn-secondary" onClick={handleReset}>
              重新开始
            </button>
          </div>
        </section>
      )}

      {step === 'reveal' && (
        <section className="result">
          <h2>占卜结果</h2>

          <div className="result-cards">
            {drawnCards.map((card, idx) => (
              <div key={idx} className="result-card">
                <TarotCard card={card} faceUp={true} />
                <div className="result-card-info">
                  <h4>{selectedSpread.positions?.[idx]?.name || `位置 ${idx + 1}`}</h4>
                  <span className={`card-position-type ${card.isReversed ? 'reversed' : 'upright'}`}>
                    {card.isReversed ? '逆位' : '正位'}
                  </span>
                  <p className="card-meaning">
                    {card.isReversed ? card.reversedDescription : card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="result-actions">
            <button className="btn btn-secondary" onClick={() => setStep('question')}>
              重新问题
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAIInterpretation}
              disabled={aiLoading || aiCooldown > 0}
            >
              {aiLoading ? '解读中...' : aiCooldown > 0 ? `请等待 ${aiCooldown}s` : 'AI深度解读'}
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
              <h3>AI 深度解读</h3>

              <div className="interpretation-question">
                <div className="question-label">
                  <span>❓</span>
                  <span>您的提问</span>
                </div>
                <p className="question-text">&ldquo;{question || '无特定问题，希望了解整体运势'}&rdquo;</p>
                <p className="question-meta">
                  牌阵：{selectedSpread?.name} | 抽牌：{drawnCards.length}张
                </p>
              </div>

              <div className="interpretation-sections">
                {parseInterpretation(aiInterpretation).map((section, idx) => (
                  <div key={idx} className="interpretation-section">
                    <div className="interpretation-section-title">
                      <span>{section.icon || '📖'}</span>
                      <span>{section.title || '综合解读'}</span>
                    </div>
                    <div className="interpretation-section-content">
                      {renderMarkdownContent(section.content || '')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug 信息面板 */}
          {(debugMode && lastRequest) && (
            <div className="debug-panel">
              <h4>调试信息</h4>
              <p><strong>请求时间:</strong> {lastRequest.timestamp}</p>
              <p><strong>牌阵:</strong> {lastRequest.spread}</p>
              <p><strong>角色:</strong> {lastRequest.persona}</p>
              <p><strong>卡牌数:</strong> {lastRequest.cardCount}</p>
              <p><strong>问题:</strong> {lastRequest.question}</p>
              <details>
                <summary style={{ cursor: 'pointer', color: 'var(--color-secondary)' }}>完整请求数据</summary>
                <pre>{JSON.stringify(lastRequest, null, 2)}</pre>
              </details>
              <details>
                <summary style={{ cursor: 'pointer', color: 'var(--color-secondary)' }}>抽卡详情</summary>
                <pre>{JSON.stringify(drawnCards.map(c => ({
                  id: c.id,
                  name: c.name,
                  isReversed: c.isReversed,
                  position: c.position
                })), null, 2)}</pre>
              </details>
              {lastRequest.aiRawResponse && (
                <details>
                  <summary style={{ cursor: 'pointer', color: 'var(--color-secondary)' }}>AI 原始回复</summary>
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
            显示调试信息
          </label>

          <div className="action-bar" style={{ marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={handleReset}>
              重新占卜
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default Divination;