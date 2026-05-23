import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { renderHook } from '@testing-library/react';

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
  let originalIntersectionObserver;

  beforeEach(() => {
    originalIntersectionObserver = global.IntersectionObserver;
  });

  afterEach(() => {
    if (originalIntersectionObserver !== undefined) {
      global.IntersectionObserver = originalIntersectionObserver;
    }
  });

  describe('Basic functionality', () => {
    it('should provide elementRef that attaches to element', () => {
      render(<TestComponent />);
      const element = screen.getByTestId('observed-element');
      expect(element).toBeInTheDocument();
    });
  });

  describe('Fallback behavior (no IntersectionObserver)', () => {
    it('should set isIntersecting to true when IntersectionObserver is not supported', () => {
      delete global.IntersectionObserver;

      render(<TestComponent />);

      expect(screen.getByTestId('is-intersecting').textContent).toBe('true');
      expect(screen.getByTestId('has-intersected').textContent).toBe('true');
    });

    it('should return false for disabled observer', () => {
      delete global.IntersectionObserver;
      const { result } = renderHook(() => useIntersectionObserver({ enabled: false }));
      expect(result.current.isIntersecting).toBe(false);
    });
  });

  describe('Enabled option', () => {
    it('should not create observer when enabled is false', () => {
      render(<TestComponent options={{ enabled: false }} />);
      expect(screen.getByTestId('observed-element')).toBeInTheDocument();
      expect(screen.getByTestId('is-intersecting').textContent).toBe('false');
      expect(screen.getByTestId('has-intersected').textContent).toBe('false');
    });
  });

  describe('Mocked IntersectionObserver behavior', () => {
    it('should trigger unobserve when element becomes intersecting', async () => {
      const unobserveMock = vi.fn();

      const MockIntersectionObserver = vi.fn(() => ({
        observe: vi.fn(),
        unobserve: unobserveMock,
        disconnect: vi.fn()
      }));
      global.IntersectionObserver = MockIntersectionObserver;

      render(<TestComponent />);

      await act(async () => {
        const observerCall = MockIntersectionObserver.mock.calls[0];
        const callback = observerCall[0];
        callback([
          { isIntersecting: true, target: screen.getByTestId('observed-element') }
        ]);
      });

      expect(unobserveMock).toHaveBeenCalled();
    });

    it('should not unobserve when element is not intersecting', async () => {
      const unobserveMock = vi.fn();

      const MockIntersectionObserver = vi.fn(() => ({
        observe: vi.fn(),
        unobserve: unobserveMock,
        disconnect: vi.fn()
      }));
      global.IntersectionObserver = MockIntersectionObserver;

      render(<TestComponent />);

      await act(async () => {
        const observerCall = MockIntersectionObserver.mock.calls[0];
        const callback = observerCall[0];
        callback([
          { isIntersecting: false, target: screen.getByTestId('observed-element') }
        ]);
      });

      expect(unobserveMock).not.toHaveBeenCalled();
    });

    it('should disconnect observer on cleanup', () => {
      const disconnectMock = vi.fn();

      const MockIntersectionObserver = vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: disconnectMock
      }));
      global.IntersectionObserver = MockIntersectionObserver;

      const { unmount } = render(<TestComponent />);
      unmount();

      expect(disconnectMock).toHaveBeenCalled();
    });

    it('should set hasIntersected to true when intersecting', async () => {
      const MockIntersectionObserver = vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      }));
      global.IntersectionObserver = MockIntersectionObserver;

      render(<TestComponent />);

      await act(async () => {
        const observerCall = MockIntersectionObserver.mock.calls[0];
        const callback = observerCall[0];
        callback([
          { isIntersecting: true, target: screen.getByTestId('observed-element') }
        ]);
      });

      expect(screen.getByTestId('has-intersected').textContent).toBe('true');
    });
  });

  describe('Multiple entries handling', () => {
    it('should handle multiple entries in callback', async () => {
      const MockIntersectionObserver = vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
      }));
      global.IntersectionObserver = MockIntersectionObserver;

      render(<TestComponent />);

      await act(async () => {
        const observerCall = MockIntersectionObserver.mock.calls[0];
        const callback = observerCall[0];
        callback([
          { isIntersecting: false, target: screen.getByTestId('observed-element') },
          { isIntersecting: true, target: screen.getByTestId('observed-element') }
        ]);
      });

      expect(screen.getByTestId('has-intersected').textContent).toBe('true');
    });
  });
});