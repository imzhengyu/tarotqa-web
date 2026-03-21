import { useState, memo } from 'react';
import PropTypes from 'prop-types';
import './TarotCard.css';

const TarotCard = memo(function TarotCard({ card, faceUp = false, onClick, small = false, selected = false }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isReversed = card?.isReversed ?? false;
  const showReversed = faceUp && isReversed;

  return (
    <div
      className={`tarot-card ${faceUp ? 'face-up' : ''} ${small ? 'small' : ''} ${selected ? 'selected' : ''} ${showReversed ? 'reversed' : ''}`}
      onClick={onClick}
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
                {!imageLoaded && !imageError && (
                  <div className="card-image-placeholder">
                    <div className="placeholder-pattern"></div>
                  </div>
                )}
                {imageError && (
                  <div className="card-image-error">
                    <span className="error-icon">🖼️</span>
                    <span className="error-text">图片加载失败</span>
                  </div>
                )}
                {!imageError && (
                  <img
                    src={card.localPath ? `${import.meta.env.BASE_URL}${card.localPath}` : card.imageUrl}
                    alt={card.name}
                    className="card-image"
                    loading="lazy"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageLoaded(true);
                      setImageError(true);
                    }}
                    style={{ opacity: imageLoaded ? 1 : 0 }}
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
