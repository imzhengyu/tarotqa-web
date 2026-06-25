import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  StarIcon,
  SparkleEffect,
  TarotSuitSymbol,
  ZodiacSymbol,
  ConstellationPattern,
  OrbGlow,
  MoonPhase,
  FloatingParticle
} from '../../components/common/DecorativeElements';

describe('StarIcon', () => {
  it('should render svg with default size', () => {
    render(<StarIcon />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('width')).toBe('20');
  });

  it('should apply custom size', () => {
    render(<StarIcon size={40} />);
    expect(document.querySelector('svg').getAttribute('width')).toBe('40');
  });

  it('should apply custom className', () => {
    render(<StarIcon className="my-star" />);
    expect(document.querySelector('.my-star')).toBeInTheDocument();
  });
});

describe('SparkleEffect', () => {
  it('should render svg', () => {
    render(<SparkleEffect />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply custom size', () => {
    render(<SparkleEffect size={60} />);
    expect(document.querySelector('svg').getAttribute('width')).toBe('60');
  });
});

describe('TarotSuitSymbol', () => {
  it('should render major suit symbol by default', () => {
    render(<TarotSuitSymbol />);
    expect(document.querySelector('.tarot-suit-symbol').textContent).toBe('✧');
  });

  it('should render cups symbol', () => {
    render(<TarotSuitSymbol suit="cups" />);
    expect(document.querySelector('.tarot-suit-symbol').textContent).toBe('♥');
  });

  it('should fallback to major for invalid suit', () => {
    render(<TarotSuitSymbol suit="invalid" />);
    expect(document.querySelector('.tarot-suit-symbol').textContent).toBe('✧');
  });
});

describe('ZodiacSymbol', () => {
  it('should render aries symbol', () => {
    render(<ZodiacSymbol sign="aries" />);
    expect(document.querySelector('.zodiac-symbol')).toBeInTheDocument();
  });

  it('should fallback for invalid sign', () => {
    render(<ZodiacSymbol sign="invalid" />);
    expect(document.querySelector('.zodiac-symbol')).toBeInTheDocument();
  });

  it('should apply custom size', () => {
    render(<ZodiacSymbol sign="aries" size={40} />);
    expect(document.querySelector('svg').getAttribute('width')).toBe('40');
  });
});

describe('ConstellationPattern', () => {
  it('should render svg with stars', () => {
    render(<ConstellationPattern stars={3} />);
    expect(document.querySelectorAll('circle').length).toBeGreaterThan(0);
  });

  it('should render connecting lines between stars', () => {
    render(<ConstellationPattern stars={3} />);
    expect(document.querySelectorAll('line').length).toBe(2);
  });
});

describe('OrbGlow', () => {
  it('should render svg', () => {
    render(<OrbGlow />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply custom size', () => {
    render(<OrbGlow size={100} />);
    expect(document.querySelector('svg').getAttribute('width')).toBe('100');
  });
});

describe('MoonPhase', () => {
  it('should render full moon by default', () => {
    render(<MoonPhase />);
    expect(document.querySelector('.moon-phase').textContent).toBe('🌕');
  });

  it('should render new moon', () => {
    render(<MoonPhase phase="new" />);
    expect(document.querySelector('.moon-phase').textContent).toBe('🌑');
  });

  it('should fallback to full for invalid phase', () => {
    render(<MoonPhase phase="invalid" />);
    expect(document.querySelector('.moon-phase').textContent).toBe('🌕');
  });
});

describe('FloatingParticle', () => {
  it('should render svg', () => {
    render(<FloatingParticle />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply custom size', () => {
    render(<FloatingParticle size={8} />);
    expect(document.querySelector('svg').getAttribute('width')).toBe('8');
  });
});
