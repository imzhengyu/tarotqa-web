import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Statistics from '../../pages/Statistics';
import { LanguageProvider } from '../../context/LanguageContext';

vi.mock('../../hooks/useVisitStats', () => ({
  default: vi.fn()
}));

vi.mock('../../hooks/useBackToTop', () => ({
  useBackToTop: vi.fn(() => ({ showBackToTop: false, scrollToTop: vi.fn() }))
}));

vi.mock('../../components/PieChart', () => ({
  default: vi.fn(({ title }) => <div data-testid="pie-chart">{title}</div>)
}));

import useVisitStats from '../../hooks/useVisitStats';

const TestWrapper = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

const baseStats = {
  totalSessions: 10,
  totalQuestions: 25
};

const createMockStats = (overrides = {}) => ({
  isInitialized: true,
  stats: { ...baseStats, ...overrides.stats },
  clearAllStats: vi.fn(),
  getTodayQuestions: vi.fn(() => overrides.todayQuestions ?? 3),
  getWeekQuestions: vi.fn(() => overrides.weekQuestions ?? 12),
  getRecentRecords: vi.fn(() => overrides.records ?? []),
  getDeviceStatsWithPercentage: vi.fn(() => overrides.deviceStats ?? [{ label: 'desktop', value: 5 }]),
  getOsStatsWithPercentage: vi.fn(() => overrides.osStats ?? [{ label: 'Windows', value: 5 }])
});

describe('Statistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
    window.alert = vi.fn();
  });

  it('should show loading state when not initialized', () => {
    useVisitStats.mockReturnValue({
      isInitialized: false,
      stats: baseStats,
      clearAllStats: vi.fn(),
      getTodayQuestions: vi.fn(),
      getWeekQuestions: vi.fn(),
      getRecentRecords: vi.fn(),
      getDeviceStatsWithPercentage: vi.fn(),
      getOsStatsWithPercentage: vi.fn()
    });

    render(<Statistics />, { wrapper: TestWrapper });
    expect(screen.getByText('访问统计')).toBeInTheDocument();
    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });

  it('should render overview stats', () => {
    useVisitStats.mockReturnValue(createMockStats());
    render(<Statistics />, { wrapper: TestWrapper });

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });

  it('should render pie charts', () => {
    useVisitStats.mockReturnValue(createMockStats());
    render(<Statistics />, { wrapper: TestWrapper });

    expect(screen.getByText('设备分布')).toBeInTheDocument();
    expect(screen.getByText('操作系统')).toBeInTheDocument();
  });

  it('should show empty records message', () => {
    useVisitStats.mockReturnValue(createMockStats());
    render(<Statistics />, { wrapper: TestWrapper });

    expect(screen.getByText('暂无访问记录')).toBeInTheDocument();
  });

  it('should render recent records', () => {
    const records = [
      { sessionId: 's1', lastVisit: '2026-06-25T10:30:00.000Z', deviceType: 'desktop', questionCount: 2 },
      { sessionId: 's2', lastVisit: '2026-06-25T08:15:00.000Z', deviceType: 'mobile', questionCount: 1 }
    ];
    useVisitStats.mockReturnValue(createMockStats({ records }));
    render(<Statistics />, { wrapper: TestWrapper });

    expect(screen.getByText('最近访问记录')).toBeInTheDocument();
    expect(screen.getByText('桌面')).toBeInTheDocument();
    expect(screen.getByText('手机')).toBeInTheDocument();
    expect(document.querySelectorAll('.records-row')).toHaveLength(2);
  });

  it('should handle unknown device type', () => {
    const records = [
      { sessionId: 's1', lastVisit: '2026-06-25T10:30:00.000Z', deviceType: 'tablet', questionCount: 1 }
    ];
    useVisitStats.mockReturnValue(createMockStats({ records }));
    render(<Statistics />, { wrapper: TestWrapper });

    expect(screen.getByText('平板')).toBeInTheDocument();
  });

  it('should clear all stats when confirmed', () => {
    const clearAllStats = vi.fn();
    useVisitStats.mockReturnValue({ ...createMockStats(), clearAllStats });
    render(<Statistics />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByText('清除所有记录'));

    expect(window.confirm).toHaveBeenCalled();
    expect(clearAllStats).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('访问记录已清除');
  });

  it('should not clear stats when cancelled', () => {
    window.confirm = vi.fn(() => false);
    const clearAllStats = vi.fn();
    useVisitStats.mockReturnValue({ ...createMockStats(), clearAllStats });
    render(<Statistics />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByText('清除所有记录'));

    expect(window.confirm).toHaveBeenCalled();
    expect(clearAllStats).not.toHaveBeenCalled();
  });

  it('should show zero average when no sessions', () => {
    useVisitStats.mockReturnValue(createMockStats({ stats: { totalSessions: 0, totalQuestions: 0 } }));
    render(<Statistics />, { wrapper: TestWrapper });

    expect(screen.getByText('0.0')).toBeInTheDocument();
  });

  it('should handle missing record time', () => {
    const records = [
      { sessionId: 's1', lastVisit: null, deviceType: 'desktop', questionCount: 1 }
    ];
    useVisitStats.mockReturnValue(createMockStats({ records }));
    render(<Statistics />, { wrapper: TestWrapper });

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
