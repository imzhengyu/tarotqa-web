import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIRequestCooldown } from '../../hooks/useAIRequestCooldown';

describe('useAIRequestCooldown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem('test_cooldown_end');
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem('test_cooldown_end');
  });

  it('should initialize with aiCooldown=0 when no stored end time', () => {
    const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));
    expect(result.current.aiCooldown).toBe(0);
  });

  it('should have canMakeAIRequest function that returns true when not in cooldown', () => {
    const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));
    expect(result.current.canMakeAIRequest()).toBe(true);
  });

  it('should have showCooldownToast false when not in cooldown', () => {
    const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));
    expect(result.current.showCooldownToast).toBe(false);
  });

  describe('startCooldown', () => {
    it('should set aiCooldown to TIMING value when startCooldown is called', () => {
      const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));

      act(() => {
        result.current.startCooldown();
      });

      expect(result.current.aiCooldown).toBe(5); // Debug TIMING.AI_COOLDOWN_SECONDS
    });

    it('should set canMakeAIRequest to return false when in cooldown', () => {
      const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));

      act(() => {
        result.current.startCooldown();
      });

      expect(result.current.canMakeAIRequest()).toBe(false);
    });

    it('should decrease aiCooldown over time', () => {
      const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));

      act(() => {
        result.current.startCooldown();
      });

      expect(result.current.aiCooldown).toBe(5);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.aiCooldown).toBe(4);
    });

    it('should reset to 0 after cooldown expires', () => {
      const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));

      act(() => {
        result.current.startCooldown();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.aiCooldown).toBe(0);
      expect(result.current.canMakeAIRequest()).toBe(true);
    });
  });

  describe('startCooldownTimer', () => {
    it('should start timer when called', () => {
      const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));

      act(() => {
        result.current.startCooldownTimer();
      });

      // Should still be 0 but timer should be running
      expect(result.current.aiCooldown).toBe(0);
    });
  });

  describe('aiCooldownEnd', () => {
    it('should return 0 when no end time is stored', () => {
      const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));
      expect(result.current.aiCooldownEnd).toBe(0);
    });

    it('should return end timestamp when cooldown is active', () => {
      const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));

      act(() => {
        result.current.startCooldown();
      });

      expect(result.current.aiCooldownEnd).not.toBe(0);
      expect(typeof result.current.aiCooldownEnd).toBe('number');
    });
  });
});
