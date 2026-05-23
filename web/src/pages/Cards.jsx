import { useState, useEffect } from 'react';
import TarotCard from '../components/TarotCard';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useBackToTop } from '../hooks/useBackToTop';
import './Cards.css';

const suitNames = {
  wands: { zh: '权杖', en: 'Wands' },
  cups: { zh: '圣杯', en: 'Cups' },
  swords: { zh: '宝剑', en: 'Swords' },
  pentacles: { zh: '金币', en: 'Pentacles' }
};

function Cards() {
  const { language, t } = useLanguage();
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const { showBackToTop, scrollToTop } = useBackToTop();

  useEffect(() => {
    loadCards();
  }, []);

  useEffect(() => {
    let result = cards;
    if (filter !== 'all') {
      result = result.filter(c => c.arcana === filter);
    }
    if (search) {
      result = result.filter(c =>
        c.name.includes(search) ||
        c.nameEn.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredCards(result);
  }, [cards, search, filter]);

  const loadCards = async () => {
    try {
      const data = await api.getCards();
      setCards(data);
      setFilteredCards(data);
      setTimeout(() => setCardsLoaded(true), 50);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGroupedCards = () => {
    if (filter !== 'all') {
      return [{ title: filter === 'major' ? t('大阿卡纳', 'Major Arcana') : t('小阿卡纳', 'Minor Arcana'), cards: filteredCards }];
    }

    const majorCards = filteredCards.filter(c => c.arcana === 'major');
    const minorCards = filteredCards.filter(c => c.arcana === 'minor');

    const groups = [];

    if (majorCards.length > 0) {
      groups.push({ title: t('大阿卡纳', 'Major Arcana'), subtitle: 'Major Arcana', cards: majorCards });
    }

    const suits = ['wands', 'cups', 'swords', 'pentacles'];
    suits.forEach(suit => {
      const suitCards = minorCards.filter(c => c.suit === suit);
      if (suitCards.length > 0) {
        groups.push({
          title: suitNames[suit][language === 'zh' ? 'zh' : 'en'],
          subtitle: suit.charAt(0).toUpperCase() + suit.slice(1),
          cards: suitCards
        });
      }
    });

    return groups;
  };

  const groups = getGroupedCards();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="cards">
      <h1 className="page-title">{t('塔罗牌库', 'Tarot Card Library')}</h1>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder={t('搜索塔罗牌...', 'Search tarot cards...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">{t('全部', 'All')}</option>
          <option value="major">{t('大阿卡纳 (22)', 'Major Arcana (22)')}</option>
          <option value="minor">{t('小阿卡纳 (56)', 'Minor Arcana (56)')}</option>
        </select>
      </div>

      <p className="cards-count">{language === 'zh' ? `共 ${filteredCards.length} 张牌` : `${filteredCards.length} cards`}</p>

      <div className="cards-container">
        {groups.map((group, groupIdx) => (
          <div key={groupIdx} className="card-group">
            <div className="card-group-header">
              <h2>{group.title}</h2>
              <span className="card-group-subtitle">{group.subtitle}</span>
            </div>
            <div className="cards-grid">
              {group.cards.map((card, cardIdx) => {
                const globalIdx = groups.slice(0, groupIdx).reduce((sum, g) => sum + g.cards.length, 0) + cardIdx;
                const delay = Math.min(globalIdx * 30, 500);
                return (
                  <div
                    key={card.id}
                    className={`card-item ${selectedCard?.id === card.id ? 'selected' : ''} ${cardsLoaded ? 'animate-in' : ''}`}
                    style={{ animationDelay: `${delay}ms` }}
                    onClick={() => setSelectedCard(card)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCard(card);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <TarotCard card={card} faceUp small />
                    <div className="card-info">
                      <h3>{card.name}</h3>
                      <p className="card-name-en">{card.nameEn.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <div
          className="card-modal"
          onClick={() => setSelectedCard(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelectedCard(null);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <div
            className="card-modal-content"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.stopPropagation();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <TarotCard card={selectedCard} faceUp />
            <div className="card-detail">
              <h2>{selectedCard.name}</h2>
              <p className="card-name-en">{selectedCard.nameEn}</p>
              <div className="card-tags">
                <span className={`tag ${selectedCard.arcana}`}>
                  {selectedCard.arcana === 'major' ? t('大阿卡纳', 'Major Arcana') : t('小阿卡纳', 'Minor Arcana')}
                </span>
                {selectedCard.element && <span className="tag element">{selectedCard.element}</span>}
                {selectedCard.number !== null && selectedCard.number !== undefined && (
                  <span className="tag number">{language === 'zh' ? `数字 ${selectedCard.number}` : `Number ${selectedCard.number}`}</span>
                )}
              </div>
              <p className="card-description">{selectedCard.description}</p>
              <div className="card-keywords">
                <h4>{t('关键词', 'Keywords')}</h4>
                <div className="keywords-list">
                  {selectedCard.keywords?.map((kw, idx) => (
                    <span key={idx} className="keyword">{kw}</span>
                  ))}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedCard(null)}>
                {t('关闭', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title={t('回到顶部', 'Back to Top')} data-tooltip={t('回到顶部', 'Back to Top')}>
          <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10.5v10.5h14V10.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

export default Cards;