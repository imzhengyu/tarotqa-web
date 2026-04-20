import { useState, useEffect, useCallback } from 'react';
import { TIMING } from '../constants';

const AI_COOLDOWN_SECONDS = TIMING.AI_COOLDOWN_SECONDS;

/**
 * AI 请求冷却 hook
 * @param {string} storageKey - localStorage key for cooldown
 * @returns {object} - { aiCooldown, aiCooldownEnd, showCooldownToast, canMakeAIRequest, startCooldownTimer }
 */
export function useAIRequestCooldown(storageKey) {
  const [aiCooldown, setAiCooldown] = useState(0);
  const [aiCooldownEnd, setAiCooldownEnd] = useState(0);
  const [showCooldownToast, setShowCooldownToast] = useState(false);

  const canMakeAIRequest = useCallback(() => {
    const endTime = localStorage.getItem(storageKey);
    if (!endTime) return true;
    return Date.now() >= parseInt(endTime, 10);
  }, [storageKey]);

  const startCooldownTimer = useCallback(() => {
    const endTime = localStorage.getItem(storageKey);
    if (endTime) {
      const remaining = Math.max(0, Math.ceil((parseInt(endTime, 10) - Date.now()) / 1000));
      if (remaining > 0) {
        setAiCooldownEnd(parseInt(endTime, 10));
        setAiCooldown(remaining);
        setShowCooldownToast(true);
      }
    }
  }, [storageKey]);

  const startCooldown = useCallback(() => {
    const cooldownEnd = Date.now() + AI_COOLDOWN_SECONDS * 1000;
    localStorage.setItem(storageKey, cooldownEnd.toString());
    setAiCooldownEnd(cooldownEnd);
    setAiCooldown(AI_COOLDOWN_SECONDS);
    setShowCooldownToast(true);
  }, [storageKey]);

  // 冷却倒计时
  useEffect(() => {
    if (aiCooldownEnd <= 0) {
      setShowCooldownToast(false);
      return;
    }

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((aiCooldownEnd - Date.now()) / 1000));
      setAiCooldown(remaining);
      if (remaining <= 0) {
        setShowCooldownToast(false);
        setAiCooldownEnd(0);
        localStorage.removeItem(storageKey);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [aiCooldownEnd, storageKey]);

  return {
    aiCooldown,
    aiCooldownEnd,
    showCooldownToast,
    canMakeAIRequest,
    startCooldownTimer,
    startCooldown
  };
}
