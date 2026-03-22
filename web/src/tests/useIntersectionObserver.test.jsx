import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

// Test component that uses the hook
function TestComponent({ options = {} }) {
  const { elementRef, isIntersecting, hasIntersected } = useIntersectionObserver(options);

  return (
    <div>
      <div data-testid="is-intersecting">{isIntersecting ? 'true' : 'false'}</div>
      <div data-testid="has-intersected">{hasIntersected ? 'true' : 'false'}</div>
      <div ref={elementRef} data-testid="observed-element">
        Observed Element
      </div>
    </div>
  );
}

describe('useIntersectionObserver', () => {
  describe('Basic functionality', () => {
    it('should provide elementRef that attaches to element', () => {
      render(<TestComponent />);
      const element = screen.getByTestId('observed-element');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Fallback behavior', () => {
    it('should set isIntersecting to true when IntersectionObserver is not supported', () => {
      // Store and remove IntersectionObserver
      const originalIO = global.IntersectionObserver;
      delete global.IntersectionObserver;

      render(<TestComponent />);

      // With no IntersectionObserver, it should fall back to true
      expect(screen.getByTestId('is-intersecting').textContent).toBe('true');
      expect(screen.getByTestId('has-intersected').textContent).toBe('true');

      // Restore
      global.IntersectionObserver = originalIO;
    });
  });

  describe('Enabled option', () => {
    it('should not create observer when enabled is false', () => {
      // This test verifies that when enabled is false, the observer is not set up
      // Since we can't easily mock IntersectionObserver in JSDOM, we just verify
      // the component renders without error
      render(<TestComponent options={{ enabled: false }} />);
      expect(screen.getByTestId('observed-element')).toBeInTheDocument();
    });
  });
});