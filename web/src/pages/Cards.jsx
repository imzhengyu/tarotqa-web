import { useState, useEffect } from 'react';
import TarotCard from '../components/TarotCard';
import api from '../services/api';
import './Cards.css';

const suitNames = {
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '金币'
};

function Cards() {
  const [cards, setCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardsLoaded, setCardsLoaded] = useState(false);

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
      // Trigger entrance animation after data is set
      setTimeout(() => setCardsLoaded(true), 50);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  // 按大阿卡纳/小阿卡纳分组
  const getGroupedCards = () => {
    if (filter !== 'all') {
      // 单filter时直接返回一組
      return [{ title: filter === 'major' ? '大阿卡纳' : '小阿卡纳', cards: filteredCards }];
    }

    const majorCards = filteredCards.filter(c => c.arcana === 'major');
    const minorCards = filteredCards.filter(c => c.arcana === 'minor');

    const groups = [];

    if (majorCards.length > 0) {
      groups.push({ title: '大阿卡纳', subtitle: 'Major Arcana', cards: majorCards });
    }

    // 小阿卡纳按花色分组
    const suits = ['wands', 'cups', 'swords', 'pentacles'];
    suits.forEach(suit => {
      const suitCards = minorCards.filter(c => c.suit === suit);
      if (suitCards.length > 0) {
        groups.push({
          title: suitNames[suit],
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
      <h1 className="page-title">塔罗牌库</h1>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="搜索塔罗牌..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">全部</option>
          <option value="major">大阿卡纳 (22)</option>
          <option value="minor">小阿卡纳 (56)</option>
        </select>
      </div>

      <p className="cards-count">共 {filteredCards.length} 张牌</p>

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
                  {selectedCard.arcana === 'major' ? '大阿卡纳' : '小阿卡纳'}
                </span>
                {selectedCard.element && <span className="tag element">{selectedCard.element}</span>}
                {selectedCard.number !== null && selectedCard.number !== undefined && (
                  <span className="tag number">数字 {selectedCard.number}</span>
                )}
              </div>
              <p className="card-description">{selectedCard.description}</p>
              <div className="card-keywords">
                <h4>关键词</h4>
                <div className="keywords-list">
                  {selectedCard.keywords?.map((kw, idx) => (
                    <span key={idx} className="keyword">{kw}</span>
                  ))}
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedCard(null)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cards;