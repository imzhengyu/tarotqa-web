import { useState } from 'react';
import './TarotCard.css';

function TarotCard({ card, faceUp = false, onClick, small = false, selected = false }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const isReversed = card?.isReversed;
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
                {!imageLoaded && (
                  <div className="card-image-placeholder">
                    <div className="placeholder-pattern"></div>
                  </div>
                )}
                <img
                  src={card.localPath ? `${import.meta.env.BASE_URL}${card.localPath}` : card.imageUrl}
                  alt={card.name}
                  className="card-image"
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                  style={{ opacity: imageLoaded ? 1 : 0 }}
                />
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
}

export default TarotCard;
