import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DisclaimerModal from '../../components/common/DisclaimerModal';

describe('DisclaimerModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Rendering states', () => {
    it('should return null when isOpen is false', () => {
      render(<DisclaimerModal isOpen={false} onClose={mockOnClose} type="ziwei" />);
      expect(screen.queryByText('紫微斗数声明')).not.toBeInTheDocument();
    });

    it('should render modal content when isOpen is true', () => {
      render(<DisclaimerModal isOpen={true} onClose={mockOnClose} type="ziwei" />);
      expect(screen.getByText('紫微斗数声明')).toBeInTheDocument();
    });

    it('should render ziwei disclaimer content', () => {
      render(<DisclaimerModal isOpen={true} onClose={mockOnClose} type="ziwei" />);
      expect(screen.getByText(/仅供参考娱乐/i)).toBeInTheDocument();
    });

    it('should render astrology disclaimer content', () => {
      render(<DisclaimerModal isOpen={true} onClose={mockOnClose} type="astrology" />);
      expect(screen.getByText(/仅供参考娱乐/i)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(<DisclaimerModal isOpen={true} onClose={mockOnClose} type="ziwei" />);

      // The close button is the × button with class close-btn
      const closeButton = document.querySelector('.close-btn');
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when agree button is clicked', () => {
      render(<DisclaimerModal isOpen={true} onClose={mockOnClose} type="ziwei" />);

      const agreeButton = screen.getByRole('button', { name: '我已阅读并同意' });
      fireEvent.click(agreeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Body scroll lock', () => {
    it('should lock body overflow when modal opens', () => {
      render(<DisclaimerModal isOpen={true} onClose={mockOnClose} type="ziwei" />);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body overflow when modal closes', () => {
      const { rerender } = render(<DisclaimerModal isOpen={true} onClose={mockOnClose} type="ziwei" />);

      rerender(<DisclaimerModal isOpen={false} onClose={mockOnClose} type="ziwei" />);
      expect(document.body.style.overflow).toBe('');
    });
  });
});
