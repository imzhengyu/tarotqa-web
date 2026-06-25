import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AstrologyChart, { generateAstrologyFilename } from '../../pages/astrology/AstrologyChart';
import { LanguageProvider } from '../../context/LanguageContext';

const mockBirthData = { year: 1990, month: 5, day: 15, hour: 10, minute: 30, gender: 'male' };
const mockChartData = {
  houses: [{ id: 1, longitude: 0 }],
  planets: [{
    id: 'sun',
    name: '太阳',
    nameEn: 'Sun',
    symbol: '☉',
    sign: { name: '白羊座', nameEn: 'Aries', symbol: '♈' },
    degree: 10,
    longitude: 10
  }]
};

vi.mock('react-iztro', () => ({
  Iztrolabe: vi.fn(() => <div data-testid="iztrolabe-mock">Iztrolabe</div>)
}));

vi.mock('../../services/api', () => ({
  default: {
    getAIAstrologyInterpretation: vi.fn(() => Promise.resolve('星盘解读结果'))
  }
}));

vi.mock('../../hooks/useDevice', () => ({
  useDevice: vi.fn(() => ({ deviceType: 'desktop' }))
}));

vi.mock('../../hooks/useBackToTop', () => ({
  useBackToTop: vi.fn(() => ({ showBackToTop: false, scrollToTop: vi.fn() }))
}));

vi.mock('../../hooks/useAIRequestCooldown', () => ({
  useAIRequestCooldown: vi.fn(() => ({
    aiCooldown: 0,
    showCooldownToast: false,
    startCooldownTimer: vi.fn(),
    startCooldown: vi.fn()
  }))
}));

vi.mock('../../utils/astrology/calculations', () => ({
  calculateAstrologyChart: vi.fn(() => mockChartData)
}));

vi.mock('../../utils/export', () => ({
  exportToPNG: vi.fn(() => Promise.resolve())
}));

vi.mock('../../components/common/BirthInfoForm', () => ({
  default: vi.fn(({ onChange }) => (
    <button
      data-testid="mock-birth-form"
      onClick={() => onChange(mockBirthData)}
    >
      Set Birth Data
    </button>
  ))
}));

const TestWrapper = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('generateAstrologyFilename', () => {
  it('should generate filename with birth data', () => {
    const filename = generateAstrologyFilename(mockBirthData);
    expect(filename).toMatch(/^astrology-19900515_1030-/);
  });

  it('should generate filename without birth data', () => {
    const filename = generateAstrologyFilename(null);
    expect(filename).toMatch(/^astrology-\d{8}_\d{6}$/);
  });
});

describe('AstrologyChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title', () => {
    render(<AstrologyChart />, { wrapper: TestWrapper });
    expect(screen.getByText('西方星盘排盘')).toBeInTheDocument();
  });

  it('should render birth information form', () => {
    render(<AstrologyChart />, { wrapper: TestWrapper });
    expect(screen.getByText('出生信息')).toBeInTheDocument();
  });

  it('should show chart placeholder initially', () => {
    render(<AstrologyChart />, { wrapper: TestWrapper });
    expect(screen.getByText('点击生成星盘')).toBeInTheDocument();
  });

  it('should generate chart when button clicked with birth data', async () => {
    const { calculateAstrologyChart } = await import('../../utils/astrology/calculations');

    render(<AstrologyChart />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByTestId('mock-birth-form'));
    fireEvent.click(screen.getByText('生成星盘'));

    await waitFor(() => {
      expect(calculateAstrologyChart).toHaveBeenCalledWith(mockBirthData);
    });
  });

  it('should render planet list after chart generated', async () => {
    render(<AstrologyChart />, { wrapper: TestWrapper });

    fireEvent.click(screen.getByTestId('mock-birth-form'));
    fireEvent.click(screen.getByText('生成星盘'));

    await waitFor(() => {
      expect(screen.getByText('行星位置')).toBeInTheDocument();
    });
  });
});
