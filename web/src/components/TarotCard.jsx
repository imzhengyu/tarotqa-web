import { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import { INTERSECTION } from '../constants';
import './TarotCard.css';

const TarotCard = memo(function TarotCard({ card, faceUp = false, onClick, small = false, selected = false }) {
  const [imageState, setImageState] = useState('pending'); // 'pending' | 'loading' | 'loaded' | 'error'

  const { elementRef, isIntersecting } = useIntersectionObserver({
    rootMargin: INTERSECTION.ROOT_MARGIN_PRELOAD,
    enabled: imageState === 'pending'
  });

  // When intersecting, transition to loading state to show blur effect
  useEffect(() => {
    if (isIntersecting && imageState === 'pending') {
      setImageState('loading');
    }
  }, [isIntersecting, imageState]);

  const isReversed = card?.isReversed ?? false;
  const showReversed = faceUp && isReversed;
  const imageSrc = card?.localPath ? `${import.meta.env.BASE_URL}${card.localPath}` : card?.imageUrl;

  const handleImageLoad = () => setImageState('loaded');
  const handleImageError = () => setImageState('error');

  return (
    <div
      ref={elementRef}
      className={`tarot-card ${faceUp ? 'face-up' : ''} ${small ? 'small' : ''} ${selected ? 'selected' : ''} ${showReversed ? 'reversed' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="tarot-card-inner">
        <div className="tarot-card-front">
          <div className="card-back-design">
            <div className="back-pattern"></div>
          </div>
        </div>
        <div className="tarot-card-back">
          {card && (
            <>
              <div className="card-image-container">
                {imageState === 'pending' && (
                  <div className="card-image-placeholder">
                    <div className="placeholder-pattern"></div>
                  </div>
                )}
                {imageState === 'error' && (
                  <div className="card-image-error">
                    <span className="error-icon">🖼️</span>
                    <span className="error-text">图片加载失败</span>
                  </div>
                )}
                {imageState !== 'pending' && imageState !== 'error' && (
                  <img
                    src={imageSrc}
                    alt={card.name}
                    className={`card-image ${imageState === 'loading' ? 'loading' : 'loaded'}`}
                    loading="lazy"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                )}
              </div>
              <div className="card-name-overlay">
                <span>{card.name}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

TarotCard.propTypes = {
  card: PropTypes.shape({
    name: PropTypes.string,
    localPath: PropTypes.string,
    imageUrl: PropTypes.string,
    isReversed: PropTypes.bool
  }),
  faceUp: PropTypes.bool,
  onClick: PropTypes.func,
  small: PropTypes.bool,
  selected: PropTypes.bool
};

export default TarotCard;
