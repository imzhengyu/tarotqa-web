import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DelayedPoofButton from '../../components/common/DelayedPoofButton';

const TestWrapper = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</BrowserRouter>
);

describe('DelayedPoofButton', () => {
  let originalDispatchEvent;

  beforeEach(() => {
    originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = vi.fn();
    vi.useFakeTimers();
  });

  afterEach(() => {
    window.dispatchEvent = originalDispatchEvent;
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render children', () => {
      render(<DelayedPoofButton>Click Me</DelayedPoofButton>, { wrapper: TestWrapper });
      expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<DelayedPoofButton className="custom-btn">Test</DelayedPoofButton>, { wrapper: TestWrapper });
      expect(screen.getByRole('button')).toHaveClass('custom-btn');
    });

    it('should render button element', () => {
      render(<DelayedPoofButton>Test</DelayedPoofButton>, { wrapper: TestWrapper });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Click Behavior', () => {
    it('should dispatch poof event on click', () => {
      render(<DelayedPoofButton onClick={() => {}}>Click</DelayedPoofButton>, { wrapper: TestWrapper });

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

    it('should trigger animation class', () => {
      render(<DelayedPoofButton onClick={() => {}}>Click</DelayedPoofButton>, { wrapper: TestWrapper });

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(button).toHaveClass('btn-poof');
      expect(button).toHaveClass('rippling');
    });

    it('should delay onClick execution', () => {
      const handleClick = vi.fn();
      render(<DelayedPoofButton onClick={handleClick} delay={600}>Click</DelayedPoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));

      // Should not call immediately
      expect(handleClick).not.toHaveBeenCalled();

      // Advance timer by 500ms - still not called
      vi.advanceTimersByTime(500);
      expect(handleClick).not.toHaveBeenCalled();

      // Advance timer to 600ms - should be called
      vi.advanceTimersByTime(100);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not delay when poofEnabled is false', () => {
      const handleClick = vi.fn();
      render(<DelayedPoofButton onClick={handleClick} poofEnabled={false} delay={600}>Click</DelayedPoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));

      // Should call immediately
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not dispatch poof event when poofEnabled is false', () => {
      render(<DelayedPoofButton onClick={() => {}} poofEnabled={false}>Click</DelayedPoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });

    it('should handle click without onClick handler', () => {
      render(<DelayedPoofButton poofEnabled={true}>Click</DelayedPoofButton>, { wrapper: TestWrapper });

      // Should not throw
      expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();

      // Poof event should still be dispatched
      expect(window.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Event Propagation', () => {
    it('should stop propagation to parent elements', () => {
      const parentClick = vi.fn();
      render(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div onClick={parentClick} onKeyDown={() => {}}>
          <DelayedPoofButton>Click</DelayedPoofButton>
        </div>,
        { wrapper: TestWrapper }
      );

      fireEvent.click(screen.getByRole('button'));
      expect(parentClick).not.toHaveBeenCalled();
    });

    it('should prevent default behavior', () => {
      const handleClick = vi.fn();
      render(
        <form>
          <DelayedPoofButton type="submit" onClick={handleClick}>Submit</DelayedPoofButton>
        </form>,
        { wrapper: TestWrapper }
      );

      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      // onClick should be delayed, not called immediately
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should render disabled button', () => {
      render(<DelayedPoofButton disabled>Click</DelayedPoofButton>, { wrapper: TestWrapper });
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(<DelayedPoofButton onClick={handleClick} disabled>Click</DelayedPoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not dispatch poof event when disabled', () => {
      render(<DelayedPoofButton disabled>Click</DelayedPoofButton>, { wrapper: TestWrapper });

      fireEvent.click(screen.getByRole('button'));
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
  });
});
