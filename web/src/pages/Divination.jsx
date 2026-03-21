import { useState, useEffect } from 'react';
import TarotCard from '../components/TarotCard';
import api from '../services/api';
import useVisitStats from '../hooks/useVisitStats';
import './Divination.css';

const spreads = [
  {
    id: 'single',
    name: '单牌阵',
    cards: 1,
    desc: '快速简单占卜',
    positions: [{ name: '核心问题' }]
  },
  {
    id: 'three-cards',
    name: '三牌阵',
    cards: 3,
    desc: '过去-现在-未来',
    positions: [{ name: '过去' }, { name: '现在' }, { name: '未来' }]
  },
  {
    id: 'celtic-cross',
    name: '凯尔特十字',
    cards: 10,
    desc: '深度详细分析',
    positions: [
      { name: '核心问题' },
      { name: '障碍' },
      { name: '过去' },
      { name: '现在' },
      { name: '未来' },
      { name: '自我' },
      { name: '周围' },
      { name: '希望/恐惧' },
      { name: '结果' },
      { name: '最终结局' }
    ]
  },
  {
    id: 'love-pyramid',
    name: '爱情金字塔',
    cards: 4,
    desc: '情感专项',
    positions: [
      { name: '过去' },
      { name: '现在' },
      { name: '未来' },
      { name: '结果' }
    ]
  },
  {
    id: 'horseshoe',
    name: '马蹄铁牌阵',
    cards: 7,
    desc: '综合运势',
    positions: [
      { name: '过去' },
      { name: '现在' },
      { name: '未来' },
      { name: '行动' },
      { name: '环境' },
      { name: '阻碍' },
      { name: '结果' }
    ]
  },
];

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
  const [aiCooldown, setAiCooldown] = useState(0); // 剩余冷却秒数
  const [showCooldownToast, setShowCooldownToast] = useState(false);

  // Visit stats tracking
  const { incrementQuestionCount } = useVisitStats();

  // AI 深度解读速率限制：60秒冷却
  const AI_COOLDOWN_SECONDS = 60;

  // 检查是否可以发起 AI 请求
  const canMakeAIRequest = () => {
    const lastTime = localStorage.getItem('ai_last_request_time');
    if (!lastTime) return true;
    const elapsed = (Date.now() - parseInt(lastTime, 10)) / 1000;
    return elapsed >= AI_COOLDOWN_SECONDS;
  };

  // 获取剩余冷却时间
  const getRemainingCooldown = () => {
    const lastTime = localStorage.getItem('ai_last_request_time');
    if (!lastTime) return 0;
    const elapsed = (Date.now() - parseInt(lastTime, 10)) / 1000;
    return Math.max(0, Math.ceil(AI_COOLDOWN_SECONDS - elapsed));
  };

  // 启动冷却倒计时
  const startCooldownTimer = () => {
    const remaining = getRemainingCooldown();
    if (remaining > 0) {
      setAiCooldown(remaining);
      setShowCooldownToast(true);
    }
  };

  useEffect(() => {
    loadCards();
    // 检查初始冷却状态
    if (!canMakeAIRequest()) {
      startCooldownTimer();
    }
  }, []);

  // 冷却倒计时计时器
  useEffect(() => {
    if (aiCooldown <= 0) {
      setShowCooldownToast(false);
      return;
    }

    const timer = setInterval(() => {
      const remaining = getRemainingCooldown();
      setAiCooldown(remaining);
      if (remaining <= 0) {
        setShowCooldownToast(false);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [aiCooldown]);

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
      const remaining = getRemainingCooldown();
      setAiCooldown(remaining);
      setShowCooldownToast(true);
      setAiError(`请等待 ${remaining} 秒后再试`);
      return;
    }

    setAiLoading(true);
    setAiError(null);

    // 记录请求时间
    localStorage.setItem('ai_last_request_time', Date.now().toString());

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
      setAiInterpretation(interpretation);
      // Increment question count for visit stats
      incrementQuestionCount();
    } catch (error) {
      console.error('[AI解读] 捕获错误:', error.message);
      setAiError(error.message);
    } finally {
      setAiLoading(false);
      // API调用完成后启动冷却倒计时
      const remaining = getRemainingCooldown();
      if (remaining > 0) {
        setAiCooldown(remaining);
        setShowCooldownToast(true);
      }
    }
  };

  // 渲染 Markdown 内容（支持完整 Markdown 语法）
  const renderMarkdownContent = (content) => {
    if (!content) return '';

    // 解析行内 Markdown 格式
    const parseInlineMarkdown = (text) => {
      if (!text) return text;
      if (typeof text !== 'string') return String(text);

      let result = text;

      // 转义字符
      const escapeMap = {
        '\\*': '∗',
        '\\_': '＿',
        '\\`': '｀',
        '\\[': '［',
        '\\]': '］',
        '\\<': '＜',
        '\\>': '＞',
      };
      Object.entries(escapeMap).forEach(([escaped, placeholder]) => {
        result = result.replace(new RegExp(escaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder);
      });

      // 处理行内代码 `code`
      result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

      // 处理加粗+斜体 ***text*** 或 ___text___
      result = result.replace(/(\*\*\*|___)([^*_]+)\1/g, '<strong><em>$2</em></strong>');

      // 处理加粗 **text** 或 __text__
      result = result.replace(/(\*\*|__)([^*_]+)\1/g, '<strong>$2</strong>');

      // 处理斜体 *text* 或 _text_
      result = result.replace(/(\*|_)([^*_]+)\1/g, '<em>$2</em>');

      // 恢复占位符
      Object.entries(escapeMap).forEach(([escaped, placeholder]) => {
        result = result.replace(new RegExp(placeholder, 'g'), escaped.slice(1));
      });

      // 处理链接 [text](url)
      result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

      // 处理图片 ![alt](url)
      result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-img" />');

      return result;
    };

    // 解析 Markdown 块
    const parseBlocks = (lines) => {
      const blocks = [];
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // 跳过空行
        if (!trimmed) {
          i++;
          continue;
        }

        // 标题 (# Header)
        const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = headerMatch[1].length;
          blocks.push({ type: 'header', level, content: headerMatch[2] });
          i++;
          continue;
        }

        // 水平线 --- 或 *** 或 ___
        if (/^([-*_]){3,}$/.test(trimmed)) {
          blocks.push({ type: 'hr' });
          i++;
          continue;
        }

        // 引用块 > quote
        if (trimmed.startsWith('>')) {
          const quoteLines = [];
          while (i < lines.length && lines[i].trim().startsWith('>')) {
            quoteLines.push(lines[i].trim().slice(1).trim() || ' ');
            i++;
          }
          blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
          continue;
        }

        // 表格
        if (trimmed.startsWith('|')) {
          const tableLines = [];
          while (i < lines.length && lines[i].trim().startsWith('|')) {
            tableLines.push(lines[i].trim());
            i++;
          }
          blocks.push({ type: 'table', content: tableLines.join('\n') });
          continue;
        }

        // 无序列表 - item 或 * item 或 + item
        if (/^[-*+]\s/.test(trimmed)) {
          const listItems = [];
          while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
            let item = lines[i].trim().slice(2);
            // 检查缩进子项
            let indentLevel = 0;
            const indentMatch = lines[i].match(/^(\s*)[-*+]\s/);
            if (indentMatch) {
              indentLevel = Math.floor(indentMatch[1].length / 2);
            }
            listItems.push({ indent: indentLevel, content: item });
            i++;
          }
          blocks.push({ type: 'ul', items: listItems });
          continue;
        }

        // 有序列表 1. item
        if (/^\d+\.\s/.test(trimmed)) {
          const listItems = [];
          while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
            const item = lines[i].trim().replace(/^\d+\.\s/, '');
            listItems.push(item);
            i++;
          }
          blocks.push({ type: 'ol', items: listItems });
          continue;
        }

        // 段落
        const paraLines = [];
        while (i < lines.length && lines[i].trim() &&
               !lines[i].trim().startsWith('#') &&
               !lines[i].trim().startsWith('>') &&
               !lines[i].trim().startsWith('|') &&
               !/^[-*+]\s/.test(lines[i].trim()) &&
               !/^\d+\.\s/.test(lines[i].trim()) &&
               !/^([-*_]){3,}$/.test(lines[i].trim())) {
          paraLines.push(lines[i]);
          i++;
        }
        if (paraLines.length > 0) {
          blocks.push({ type: 'paragraph', content: paraLines.join(' ') });
        }
      }

      return blocks;
    };

    // 渲染表格
    const renderTable = (tableContent) => {
      const lines = tableContent.split('\n').filter(l => l.trim());
      if (lines.length < 2) return null;

      const parseRow = (line) => line.split('|').filter(c => c.trim() && c.trim() !== '---').map(c => c.trim());

      const headerCells = parseRow(lines[0]);
      const bodyRows = lines.slice(2).map(row => parseRow(row));

      return (
        <table className="markdown-table">
          <thead>
            <tr>
              {headerCells.map((cell, ci) => <th key={ci} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cell) }} />)}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => <td key={ci} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cell) }} />)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    };

    // 渲染列表
    const renderList = (block) => {
      if (block.type === 'ul') {
        return (
          <ul className="markdown-list markdown-ul">
            {block.items.map((item, idx) => (
              <li key={idx} style={{ marginLeft: item.indent * 20 }}>
                <span dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item.content) }} />
              </li>
            ))}
          </ul>
        );
      }
      if (block.type === 'ol') {
        return (
          <ol className="markdown-list markdown-ol">
            {block.items.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item.content) }} />
            ))}
          </ol>
        );
      }
      return null;
    };

    // 渲染块
    const renderBlock = (block, idx) => {
      switch (block.type) {
        case 'header':
          const Tag = `h${block.level}`;
          return <Tag key={idx} className={`markdown-h${block.level}`} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(block.content) }} />;
        case 'hr':
          return <hr key={idx} className="markdown-hr" />;
        case 'blockquote':
          return <blockquote key={idx} className="markdown-blockquote" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(block.content) }} />;
        case 'table':
          return <div key={idx} className="markdown-table-wrapper">{renderTable(block.content)}</div>;
        case 'ul':
        case 'ol':
          return <div key={idx}>{renderList(block)}</div>;
        case 'paragraph':
          return <p key={idx} className="markdown-paragraph" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(block.content) }} />;
        default:
          return null;
      }
    };

    const lines = content.split('\n');
    const blocks = parseBlocks(lines);

    return (
      <div className="markdown-body">
        {blocks.map((block, idx) => renderBlock(block, idx))}
      </div>
    );
  };

  // 解析 AI 回复为分节格式
  const parseInterpretation = (text) => {
    if (!text || typeof text !== 'string') {
      return [{ title: '综合解读', icon: '📖', content: String(text || '') }];
    }

    // 定义分节模式：标题 + 内容
    const sectionPatterns = [
      { pattern: /【([^】]+)】/g, icon: '📖' },  // 【标题】
      { pattern: /#([^#\n]+)#/g, icon: '📖' },  // #标题#
      { pattern: /##\s*([^#\n]+)/g, icon: '📖' }, // ## 标题
      { pattern: /\*\*([^*]+)\*\*/g, icon: '📖' }, // **标题**
    ];

    // 检查是否是 Markdown 表格行
    const isMarkdownTableRow = (line) => {
      const trimmed = line.trim();
      return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|');
    };

    // 检查是否是表格分隔行（如 | --- | --- |）
    const isMarkdownTableDivider = (line) => {
      const trimmed = line.trim();
      return /^\|[\s-|]+\|$/.test(trimmed);
    };

    // 尝试按分节标题分割
    const lines = text.split('\n');
    const sections = [];
    let currentSection = { title: '综合解读', icon: '📖', content: '' };
    let inTable = false;
    let tableBuffer = [];

    lines.forEach(line => {
      // 检查是否是分节标题
      let isSectionTitle = false;
      for (const { pattern, icon } of sectionPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          // 结束当前表格（如果在进行中）
          if (tableBuffer.length > 0) {
            currentSection.content += '\n' + tableBuffer.join('\n');
            tableBuffer = [];
            inTable = false;
          }
          // 保存当前节
          if (currentSection.content && currentSection.content.trim()) {
            sections.push(currentSection);
          }
          // 开始新节
          currentSection = {
            title: (match[1] || '').trim() || '综合解读',
            icon: icon,
            content: ''
          };
          isSectionTitle = true;
          break;
        }
      }

      if (!isSectionTitle) {
        // 检测表格行
        if (isMarkdownTableRow(line) || isMarkdownTableDivider(line)) {
          if (!inTable && currentSection.content.trim()) {
            // 开始新表格前，先保存当前内容
            sections.push(currentSection);
            currentSection = { title: '综合解读', icon: '📖', content: '' };
          }
          inTable = true;
          tableBuffer.push(line);
        } else {
          // 非表格行
          if (inTable && tableBuffer.length > 0) {
            // 结束表格，添加到内容
            currentSection.content += (currentSection.content ? '\n' : '') + tableBuffer.join('\n');
            tableBuffer = [];
            inTable = false;
          }
          currentSection.content += (currentSection.content ? '\n' : '') + (line || '');
        }
      }
    });

    // 处理最后残留的表格
    if (tableBuffer.length > 0) {
      currentSection.content += '\n' + tableBuffer.join('\n');
    }

    // 添加最后一节
    if (currentSection.content && currentSection.content.trim()) {
      sections.push(currentSection);
    }

    // 如果没有分节，整个作为一节
    if (sections.length === 0) {
      sections.push({ title: '综合解读', icon: '📖', content: text });
    }

    return sections;
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
            {spreads.map(spread => (
              <div
                key={spread.id}
                className={`spread-item ${selectedSpread?.id === spread.id ? 'selected' : ''}`}
                onClick={() => handleSelectSpread(spread)}
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
            <div className="deck" onClick={handleDrawCard}>
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
                <p className="question-text">"{question || '无特定问题，希望了解整体运势'}"</p>
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