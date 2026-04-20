import { useState, useEffect, useCallback } from 'react';
import { TIMING, BREAKPOINTS } from '../constants';

const STORAGE_KEY = 'tarotqa_visit_stats';
const MAX_RECORDS = 100;
const DEVICE_STATS_UPDATE_INTERVAL = TIMING.DEVICE_STATS_UPDATE_INTERVAL_MS;

// Generate UUID v4
export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Anonymize IP address - keep first two segments
export const anonymizeIp = (ip) => {
  if (!ip) return 'unknown';
  const segments = ip.split('.');
  if (segments.length >= 2) {
    return `${segments[0]}.${segments[1]}.*.*`;
  }
  return 'unknown';
};

// Detect device type from screen width
export const detectDeviceType = () => {
  const width = window.innerWidth;
  if (width < BREAKPOINTS.TABLET) return 'mobile';
  if (width < BREAKPOINTS.DESKTOP) return 'tablet';
  return 'desktop';
};

// Detect OS from user agent
export const detectOSType = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows NT 10/i.test(ua)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
};

// Detect browser type from user agent
export const detectBrowser = () => {
  const ua = navigator.userAgent;
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) return 'Chrome';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Edge/i.test(ua)) return 'Edge';
  return 'Other';
};

// Calculate device stats from records
export const calculateDeviceStats = (records) => {
  const stats = { desktop: 0, tablet: 0, mobile: 0 };
  records.forEach(record => {
    if (record.deviceType === 'desktop') stats.desktop++;
    else if (record.deviceType === 'tablet') stats.tablet++;
    else if (record.deviceType === 'mobile') stats.mobile++;
  });
  return stats;
};

// Calculate OS stats from records
export const calculateOsStats = (records) => {
  const stats = {
    Windows: 0,
    macOS: 0,
    Linux: 0,
    Android: 0,
    iOS: 0,
    Other: 0
  };
  records.forEach(record => {
    if (Object.prototype.hasOwnProperty.call(stats, record.osType)) {
      stats[record.osType]++;
    } else {
      stats.Other++;
    }
  });
  return stats;
};

// Get session IP (simulated - in real app this would come from server)
export const getSessionIP = () => {
  // In a pure frontend app, we can't get real IP without a backend
  // We'll use a hash of available info as a pseudo-IP
  const seed = navigator.userAgent + screen.width + screen.height + new Date().getTimezoneOffset();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Generate a pseudo IPv4 format
  const part1 = Math.abs(hash % 256);
  const part2 = Math.abs((hash >> 8) % 256);
  return `${part1}.${part2}`;
};

// Load stats from localStorage
export const loadStats = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load visit stats:', e);
  }
  return null;
};

// Save stats to localStorage
export const saveStats = (stats) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save visit stats:', e);
  }
};

// Create initial stats structure
export const createInitialStats = () => {
  const now = new Date().toISOString();
  return {
    version: '1.1',
    records: [],
    stats: {
      totalSessions: 0,
      totalQuestions: 0,
      deviceStats: { desktop: 0, tablet: 0, mobile: 0 },
      osStats: {
        Windows: 0,
        macOS: 0,
        Linux: 0,
        Android: 0,
        iOS: 0,
        Other: 0
      },
      lastUpdated: now,
      lastDeviceStatsUpdate: now
    }
  };
};

export function useVisitStats() {
  const [statsData, setStatsData] = useState(() => {
    const loaded = loadStats();
    return loaded || createInitialStats();
  });
  const [currentSession, setCurrentSession] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    const now = new Date().toISOString();
    const loaded = loadStats();

    if (loaded && loaded.records.length > 0) {
      // Use existing stats, but create a new session
      const existingStats = { ...loaded };

      // Check if device stats need update (older than 1 hour)
      const lastUpdate = new Date(existingStats.stats.lastDeviceStatsUpdate || now);
      const timeSinceUpdate = Date.now() - lastUpdate.getTime();

      // Recalculate device stats if needed
      if (timeSinceUpdate > DEVICE_STATS_UPDATE_INTERVAL) {
        existingStats.stats.deviceStats = calculateDeviceStats(existingStats.records);
        existingStats.stats.osStats = calculateOsStats(existingStats.records);
        existingStats.stats.lastDeviceStatsUpdate = now;
      }

      // Create new session
      const newSession = {
        sessionId: generateUUID(),
        anonymizedIp: anonymizeIp(getSessionIP()),
        questionCount: 0,
        firstVisit: now,
        lastVisit: now,
        deviceType: detectDeviceType(),
        osType: detectOSType(),
        browser: detectBrowser()
      };

      existingStats.records.unshift(newSession);
      existingStats.stats.totalSessions++;

      // Trim to max records
      if (existingStats.records.length > MAX_RECORDS) {
        existingStats.records = existingStats.records.slice(0, MAX_RECORDS);
      }

      existingStats.stats.lastUpdated = now;

      setCurrentSession(newSession);
      setStatsData(existingStats);
      saveStats(existingStats);
    } else {
      // First visit - create new stats
      const newSession = {
        sessionId: generateUUID(),
        anonymizedIp: anonymizeIp(getSessionIP()),
        questionCount: 0,
        firstVisit: now,
        lastVisit: now,
        deviceType: detectDeviceType(),
        osType: detectOSType(),
        browser: detectBrowser()
      };

      const newStats = createInitialStats();
      newStats.records.push(newSession);
      newStats.stats.totalSessions = 1;
      newStats.stats.deviceStats[newSession.deviceType] = 1;
      newStats.stats.osStats[newSession.osType] = 1;
      newStats.stats.lastDeviceStatsUpdate = now;

      setCurrentSession(newSession);
      setStatsData(newStats);
      saveStats(newStats);
    }

    setIsInitialized(true);
  }, []);

  // Increment question count
  const incrementQuestionCount = useCallback(() => {
    if (!currentSession) return;

    setStatsData(prev => {
      const updated = { ...prev };

      // Update current session question count
      const sessionIndex = updated.records.findIndex(r => r.sessionId === currentSession.sessionId);
      if (sessionIndex !== -1) {
        updated.records[sessionIndex].questionCount++;
        updated.records[sessionIndex].lastVisit = new Date().toISOString();
      }

      // Update totals
      updated.stats.totalQuestions++;
      updated.stats.lastUpdated = new Date().toISOString();

      saveStats(updated);
      return updated;
    });
  }, [currentSession]);

  // Clear all stats
  const clearAllStats = useCallback(() => {
    const initial = createInitialStats();
    setCurrentSession(null);
    localStorage.removeItem(STORAGE_KEY);

    // Create a new session after clearing
    const now = new Date().toISOString();
    const newSession = {
      sessionId: generateUUID(),
      anonymizedIp: anonymizeIp(getSessionIP()),
      questionCount: 0,
      firstVisit: now,
      lastVisit: now,
      deviceType: detectDeviceType(),
      osType: detectOSType(),
      browser: detectBrowser()
    };

    initial.records.push(newSession);
    initial.stats.totalSessions = 1;
    initial.stats.deviceStats[newSession.deviceType] = 1;
    initial.stats.osStats[newSession.osType] = 1;
    initial.stats.lastDeviceStatsUpdate = now;

    setStatsData(initial);
    setCurrentSession(newSession);
    saveStats(initial);
  }, []);

  // Get today's question count
  const getTodayQuestions = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    return statsData.records.reduce((count, record) => {
      const recordTime = new Date(record.firstVisit).getTime();
      if (recordTime >= todayStart) {
        return count + record.questionCount;
      }
      return count;
    }, 0);
  }, [statsData]);

  // Get this week's question count
  const getWeekQuestions = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.getTime();

    return statsData.records.reduce((count, record) => {
      const recordTime = new Date(record.firstVisit).getTime();
      if (recordTime >= weekStart) {
        return count + record.questionCount;
      }
      return count;
    }, 0);
  }, [statsData]);

  // Get recent records (last N sessions)
  const getRecentRecords = useCallback((limit = 10) => {
    return statsData.records.slice(0, limit);
  }, [statsData]);

  // Get device stats with percentages
  const getDeviceStatsWithPercentage = useCallback(() => {
    const total = statsData.stats.deviceStats.desktop +
                  statsData.stats.deviceStats.tablet +
                  statsData.stats.deviceStats.mobile;

    if (total === 0) {
      return [
        { type: 'desktop', label: '桌面', icon: '💻', count: 0, percentage: 0, color: '#D4AF37' },
        { type: 'tablet', label: '平板', icon: '📱', count: 0, percentage: 0, color: '#8B0000' },
        { type: 'mobile', label: '手机', icon: '📱', count: 0, percentage: 0, color: '#2D1B4E' }
      ];
    }

    return [
      { type: 'desktop', label: '桌面', icon: '💻', count: statsData.stats.deviceStats.desktop, percentage: Math.round((statsData.stats.deviceStats.desktop / total) * 100), color: '#D4AF37' },
      { type: 'tablet', label: '平板', icon: '📱', count: statsData.stats.deviceStats.tablet, percentage: Math.round((statsData.stats.deviceStats.tablet / total) * 100), color: '#8B0000' },
      { type: 'mobile', label: '手机', icon: '📱', count: statsData.stats.deviceStats.mobile, percentage: Math.round((statsData.stats.deviceStats.mobile / total) * 100), color: '#2D1B4E' }
    ];
  }, [statsData]);

  // Get OS stats with percentages
  const getOsStatsWithPercentage = useCallback(() => {
    const osStats = statsData.stats.osStats;
    const total = Object.values(osStats).reduce((sum, val) => sum + val, 0);

    const osConfig = {
      Windows: { label: 'Windows', color: '#0078D4' },
      macOS: { label: 'macOS', color: '#333333' },
      Linux: { label: 'Linux', color: '#FCC624' },
      Android: { label: 'Android', color: '#3DDC84' },
      iOS: { label: 'iOS', color: '#A2AAAD' },
      Other: { label: '其他', color: '#666666' }
    };

    return Object.entries(osStats)
      .filter(([_, count]) => count > 0)
      .map(([os, count]) => ({
        type: os,
        label: osConfig[os]?.label || os,
        color: osConfig[os]?.color || '#666666',
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [statsData]);

  return {
    isInitialized,
    stats: statsData.stats,
    incrementQuestionCount,
    clearAllStats,
    getTodayQuestions,
    getWeekQuestions,
    getRecentRecords,
    getDeviceStatsWithPercentage,
    getOsStatsWithPercentage
  };
}

export default useVisitStats;