import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBackToTop } from '../../hooks/useBackToTop';

describe('useBackToTop', () => {
  let addEventListenerMock;
  let removeEventListenerMock;
  let scrollToMock;

  beforeEach(() => {
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();
    scrollToMock = vi.fn();

    window.addEventListener = addEventListenerMock;
    window.removeEventListener = removeEventListenerMock;
    window.scrollTo = scrollToMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('should have showBackToTop as false initially', () => {
      const { result } = renderHook(() => useBackToTop());
      expect(result.current.showBackToTop).toBe(false);
    });

    it('should register scroll event listener on mount', () => {
      renderHook(() => useBackToTop());
      expect(addEventListenerMock).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    });

    it('should unregister scroll event listener on unmount', () => {
      const { unmount } = renderHook(() => useBackToTop());
      unmount();
      expect(removeEventListenerMock).toHaveBeenCalledWith('scroll', expect.any(Function));
    });

    it('should pass the same scroll handler to add and remove event listener', () => {
      const { unmount } = renderHook(() => useBackToTop());
      const addedHandler = addEventListenerMock.mock.calls[0]?.[1];
      unmount();
      const removedHandler = removeEventListenerMock.mock.calls[0]?.[1];
      expect(addedHandler).toBe(removedHandler);
    });
  });

  describe('scrollToTop function', () => {
    it('should call window.scrollTo with correct arguments', () => {
      const { result } = renderHook(() => useBackToTop());
      result.current.scrollToTop();
      expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('should call scrollTo only once per invocation', () => {
      const { result } = renderHook(() => useBackToTop());
      result.current.scrollToTop();
      result.current.scrollToTop();
      expect(scrollToMock).toHaveBeenCalledTimes(2);
    });

    it('scrollToTop should be stable across renders', () => {
      const { result, rerender } = renderHook(() => useBackToTop());
      const firstScrollToTop = result.current.scrollToTop;

      rerender();
      expect(result.current.scrollToTop).toBe(firstScrollToTop);
    });
  });

  describe('Returned API', () => {
    it('should return showBackToTop and scrollToTop', () => {
      const { result } = renderHook(() => useBackToTop());
      expect(result.current).toHaveProperty('showBackToTop');
      expect(result.current).toHaveProperty('scrollToTop');
    });

    it('showBackToTop should be a boolean', () => {
      const { result } = renderHook(() => useBackToTop());
      expect(typeof result.current.showBackToTop).toBe('boolean');
    });

    it('scrollToTop should be a function', () => {
      const { result } = renderHook(() => useBackToTop());
      expect(typeof result.current.scrollToTop).toBe('function');
    });
  });
});
