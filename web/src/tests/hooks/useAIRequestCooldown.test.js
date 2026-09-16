import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIRequestCooldown } from '../../hooks/useAIRequestCooldown';
import { TIMING } from '../../constants';

const COOLDOWN = TIMING.AI_COOLDOWN_SECONDS;

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

      expect(result.current.aiCooldown).toBe(COOLDOWN);
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

      expect(result.current.aiCooldown).toBe(COOLDOWN);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.aiCooldown).toBe(COOLDOWN - 1);
    });

    it('should reset to 0 after cooldown expires', () => {
      const { result } = renderHook(() => useAIRequestCooldown('test_cooldown_end'));

      act(() => {
        result.current.startCooldown();
      });

      act(() => {
        vi.advanceTimersByTime(COOLDOWN * 1000);
      });

      expect(result.current.aiCooldown).toBe(0);
      expect(result.current.canMakeAIRequest()).toBe(true);
    });
  });

  describe('冷却配置（回归）', () => {
    it('全站统一冷却 10 秒（塔罗/紫微/星盘共用一个存储键），可被 VITE_AI_COOLDOWN_SECONDS 覆盖', () => {
      expect(COOLDOWN).toBeGreaterThan(0);
      expect(COOLDOWN).toBe(10);
      expect(TIMING.AI_COOLDOWN_STORAGE_KEY).toBe('tarotqa_ai_cooldown_end');
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
