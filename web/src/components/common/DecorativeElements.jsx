import './DecorativeElements.css';

export function StarIcon({ size = 20, color = 'var(--color-secondary)', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`deco-star ${className}`}
      style={{ color }}
    >
      <path
        fill="currentColor"
        d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z"
      />
    </svg>
  );
}

export function SparkleEffect({ size = 40, intensity = 1, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={`deco-sparkle ${className}`}
      style={{ '--intensity': intensity }}
    >
      <defs>
        <radialGradient id="sparkleGlow">
          <stop offset="0%" stopColor="var(--color-secondary)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="15" fill="url(#sparkleGlow)" className="sparkle-glow" />
      <path
        fill="var(--color-secondary)"
        d="M20 5l1.5 5.5h5l-4 3 1.5 5.5-4-3-4 3 1.5-5.5-4-3h5z"
      />
      <path
        fill="var(--color-secondary)"
        d="M8 18l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3-2.5-2h3z"
        opacity="0.6"
      />
      <path
        fill="var(--color-secondary)"
        d="M32 18l1 3h3l-2.5 2 1 3-2.5-2-2.5 2 1-3-2.5-2h3z"
        opacity="0.6"
      />
    </svg>
  );
}

export function TarotSuitSymbol({ suit = 'major', size = 24, className = '' }) {
  const symbols = {
    major: '✧',
    wands: '♠',
    cups: '♥',
    swords: '♣',
    pentacles: '♦'
  };

  return (
    <span className={`tarot-suit-symbol ${suit} ${className}`} style={{ fontSize: size }}>
      {symbols[suit] || symbols.major}
    </span>
  );
}

export function ZodiacSymbol({ sign, size = 28, className = '' }) {
  const zodiacSymbols = {
    aries: '♈',
    taurus: '♉',
    gemini: '♊',
    cancer: '♋',
    leo: '♌',
    virgo: '♍',
    libra: '♎',
    scorpio: '♏',
    sagittarius: '♐',
    capricorn: '♑',
    aquarius: '♒',
    pisces: '♓'
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={`zodiac-symbol ${sign} ${className}`}
    >
      <text
        x="16"
        y="24"
        textAnchor="middle"
        fontSize="24"
        fill="var(--color-secondary)"
      >
        {zodiacSymbols[sign] || '★'}
      </text>
    </svg>
  );
}

export function ConstellationPattern({ stars = 5, size = 60, className = '' }) {
  const starPositions = [];
  for (let i = 0; i < stars; i++) {
    const angle = (i / stars) * Math.PI * 2;
    const x = 30 + Math.cos(angle) * 20;
    const y = 30 + Math.sin(angle) * 20;
    starPositions.push({ x, y, id: i });
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      className={`constellation-pattern ${className}`}
    >
      {starPositions.map((star, idx) => (
        <g key={star.id}>
          <circle
            cx={star.x}
            cy={star.y}
            r="2"
            fill="var(--color-secondary)"
            className="constellation-star"
          />
          {idx < starPositions.length - 1 && (
            <line
              x1={star.x}
              y1={star.y}
              x2={starPositions[idx + 1].x}
              y2={starPositions[idx + 1].y}
              stroke="var(--color-secondary)"
              strokeWidth="0.5"
              opacity="0.4"
            />
          )}
        </g>
      ))}
    </svg>
  );
}

export function OrbGlow({ size = 80, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={`orb-glow ${className}`}
    >
      <defs>
        <radialGradient id="orbGradient" cx="30%" cy="30%">
          <stop offset="0%" stopColor="rgba(212, 175, 55, 0.6)" />
          <stop offset="50%" stopColor="rgba(45, 27, 78, 0.4)" />
          <stop offset="100%" stopColor="rgba(26, 15, 46, 0.8)" />
        </radialGradient>
        <filter id="orbBlur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <circle cx="40" cy="40" r="30" fill="url(#orbGradient)" className="orb-core" />
      <circle
        cx="40"
        cy="40"
        r="35"
        fill="none"
        stroke="var(--color-secondary)"
        strokeWidth="1"
        opacity="0.3"
        className="orb-ring"
      />
      <circle
        cx="40"
        cy="40"
        r="38"
        fill="none"
        stroke="var(--color-secondary)"
        strokeWidth="0.5"
        opacity="0.2"
        className="orb-ring outer"
      />
    </svg>
  );
}

export function MoonPhase({ phase = 'full', size = 32, className = '' }) {
  const phases = {
    new: '🌑',
    waxing: '🌒',
    first: '🌓',
    waxingGibbous: '🌔',
    full: '🌕',
    waningGibbous: '🌖',
    last: '🌗',
    waning: '🌘'
  };

  return (
    <span className={`moon-phase ${phase} ${className}`} style={{ fontSize: size }}>
      {phases[phase] || phases.full}
    </span>
  );
}

export function FloatingParticle({ size = 4, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 4 4"
      className={`floating-particle ${className}`}
    >
      <circle cx="2" cy="2" r="2" fill="var(--color-secondary)" />
    </svg>
  );
}

export default {
  StarIcon,
  SparkleEffect,
  TarotSuitSymbol,
  ZodiacSymbol,
  ConstellationPattern,
  OrbGlow,
  MoonPhase,
  FloatingParticle
};
