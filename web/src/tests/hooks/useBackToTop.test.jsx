import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
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

  // 回归：原来这 3 条只断言"是布尔/是函数"，跑过了也说明不了行为。
  // 现在直接驱动滚动事件，验证阈值行为本身。
  describe('滚动阈值行为', () => {
    const scrollTo = (handler, y) => {
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
      act(() => handler());
    };

    it('未超过阈值时不显示，超过阈值后显示', () => {
      const { result } = renderHook(() => useBackToTop());
      const handler = addEventListenerMock.mock.calls[0][1];

      scrollTo(handler, 400);
      expect(result.current.showBackToTop).toBe(false);

      scrollTo(handler, 1200);
      expect(result.current.showBackToTop).toBe(true);

      scrollTo(handler, 0);
      expect(result.current.showBackToTop).toBe(false);
    });

    it('阈值可通过参数自定义', () => {
      const { result } = renderHook(() => useBackToTop(100));
      const handler = addEventListenerMock.mock.calls[0][1];

      scrollTo(handler, 150);
      expect(result.current.showBackToTop).toBe(true);
    });
  });
});
