import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MysticEffects from '../../components/MysticEffects';

describe('MysticEffects', () => {
  describe('Rendering', () => {
    it('should render mist overlay', () => {
      render(<MysticEffects />);
      expect(document.querySelector('.mist-overlay')).toBeInTheDocument();
    });

    it('should render cursor glow', () => {
      render(<MysticEffects />);
      expect(document.querySelector('.cursor-glow')).toBeInTheDocument();
    });

    it('should render stardust container', () => {
      render(<MysticEffects />);
      expect(document.querySelector('.stardust-container')).toBeInTheDocument();
    });

    it('should render poof container', () => {
      render(<MysticEffects />);
      expect(document.querySelector('.poof-container')).toBeInTheDocument();
    });

    it('should have cursor glow with transform style', () => {
      render(<MysticEffects />);
      const cursorGlow = document.querySelector('.cursor-glow');
      expect(cursorGlow).toHaveAttribute('style');
      expect(cursorGlow.getAttribute('style')).toContain('transform');
    });

    it('should have stardust container with correct class', () => {
      render(<MysticEffects />);
      const container = document.querySelector('.stardust-container');
      expect(container).toHaveClass('stardust-container');
    });

    it('should have poof container with correct class', () => {
      render(<MysticEffects />);
      const container = document.querySelector('.poof-container');
      expect(container).toHaveClass('poof-container');
    });

    it('should have mist overlay with correct class', () => {
      render(<MysticEffects />);
      const mist = document.querySelector('.mist-overlay');
      expect(mist).toHaveClass('mist-overlay');
    });
  });
});
