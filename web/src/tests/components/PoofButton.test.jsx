import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PoofButton from '../../components/common/PoofButton';

const TestWrapper = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</BrowserRouter>
);

describe('PoofButton', () => {
  let originalDispatchEvent;

  beforeEach(() => {
    originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    window.dispatchEvent = originalDispatchEvent;
  });

  describe('Rendering', () => {
    it('should render children', () => {
      render(<PoofButton>Click Me</PoofButton>, { wrapper: TestWrapper });
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<PoofButton className="custom-btn">Test</PoofButton>, { wrapper: TestWrapper });
      expect(screen.getByRole('button')).toHaveClass('custom-btn');
    });

    it('should render button element', () => {
      render(<PoofButton>Test</PoofButton>, { wrapper: TestWrapper });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('should call onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<PoofButton onClick={handleClick}>Click</PoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should dispatch poof event on click', () => {
      render(<PoofButton onClick={() => {}}>Click</PoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'poof',
          detail: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number)
          })
        })
      );
    });

    it('should not dispatch poof event when poofEnabled is false', () => {
      render(<PoofButton onClick={() => {}} poofEnabled={false}>Click</PoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });

    it('should still call onClick when poofEnabled is false', () => {
      const handleClick = vi.fn();
      render(<PoofButton onClick={handleClick} poofEnabled={false}>Click</PoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger animation class', () => {
      render(<PoofButton onClick={() => {}}>Click</PoofButton>, { wrapper: TestWrapper });

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(button).toHaveClass('btn-poof');
    });
  });

  describe('Disabled State', () => {
    it('should render disabled button', () => {
      render(<PoofButton disabled>Click</PoofButton>, { wrapper: TestWrapper });
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<PoofButton onClick={handleClick} disabled>Click</PoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not dispatch poof event when disabled', () => {
      render(<PoofButton disabled>Click</PoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
  });
});
