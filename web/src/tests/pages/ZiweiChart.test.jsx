import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ZiweiChart, { generateZiweiFilename, formatBirthday } from '../../pages/ziwei/ZiweiChart';
import ZiweiChartForm from '../../pages/ziwei/ZiweiChartForm';
import ZiweiChartDisplay from '../../pages/ziwei/ZiweiChartDisplay';
import { LanguageProvider } from '../../context/LanguageContext';

const mockBirthData = { year: 1990, month: 5, day: 15, hour: 10, minute: 30, gender: 'male' };

vi.mock('react-iztro', () => ({
  Iztrolabe: vi.fn(() => <div data-testid="iztrolabe-mock">Iztrolabe</div>)
}));

vi.mock('../../services/api', () => ({
  default: {
    getAIZiweiInterpretation: vi.fn(() => Promise.resolve('紫微解读结果'))
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

vi.mock('../../utils/ziwei/ziweiData', () => ({
  generateZiweiData: vi.fn(() => ({ data: 'mock' })),
  formatZiweiPrompt: vi.fn(() => 'prompt')
}));

vi.mock('../../utils/export', () => ({
  exportToPNG: vi.fn(() => Promise.resolve())
}));

vi.mock('../../components/common/BirthInfoForm', () => ({
  default: vi.fn(({ onChange }) => (
    <button data-testid="mock-birth-form" onClick={() => onChange(mockBirthData)}>
      Set Birth Data
    </button>
  ))
}));

const TestWrapper = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('formatBirthday', () => {
  it('should format birth data as YYYY-MM-DD', () => {
    expect(formatBirthday({ year: 1990, month: 5, day: 15 })).toBe('1990-05-15');
  });

  it('should return empty string when birthData is null', () => {
    expect(formatBirthday(null)).toBe('');
  });
});

describe('generateZiweiFilename', () => {
  it('should generate filename with birth data', () => {
    const filename = generateZiweiFilename({ year: 1990, month: 5, day: 15, hour: 10, minute: 30 });
    expect(filename).toMatch(/^ziwei-19900515_1030-/);
  });

  it('should generate filename without birth data', () => {
    const filename = generateZiweiFilename(null);
    expect(filename).toMatch(/^ziwei-\d{8}_\d{6}$/);
  });
});

describe('ZiweiChartForm', () => {
  it('should render form elements', () => {
    render(
      <LanguageProvider>
        <ZiweiChartForm
          birthData={null}
          onChange={vi.fn()}
          onGenerate={vi.fn()}
          t={(zh) => zh}
        />
      </LanguageProvider>
    );
    expect(screen.getByText('出生信息')).toBeInTheDocument();
    expect(screen.getByText('生成命盘')).toBeInTheDocument();
  });

  it('should call onGenerate when button clicked', async () => {
    const onGenerate = vi.fn();
    render(
      <LanguageProvider>
        <ZiweiChartForm
          birthData={{ year: 1990, month: 1, day: 1 }}
          onChange={vi.fn()}
          onGenerate={onGenerate}
          t={(zh) => zh}
        />
      </LanguageProvider>
    );
    fireEvent.click(screen.getByText('生成命盘'));
    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
  });
});

describe('ZiweiChartDisplay', () => {
  it('should render placeholder when no birthData', () => {
    render(
      <ZiweiChartDisplay
        birthData={null}
        onAnalyze={vi.fn()}
        onClearError={vi.fn()}
        generateFilename={generateZiweiFilename}
        t={(zh) => zh}
      />
    );
    expect(screen.getByText('点击生成命盘')).toBeInTheDocument();
  });

  it('should render chart when birthData exists', () => {
    render(
      <ZiweiChartDisplay
        birthData={{ year: 1990, month: 5, day: 15, hour: 10, gender: 'male' }}
        birthdayStr="1990-05-15"
        horoscopeDate={new Date()}
        onAnalyze={vi.fn()}
        onClearError={vi.fn()}
        generateFilename={generateZiweiFilename}
        t={(zh) => zh}
      />
    );
    expect(screen.getByTestId('iztrolabe-mock')).toBeInTheDocument();
  });

  it('should call onAnalyze when analyze button clicked', () => {
    const onAnalyze = vi.fn();
    render(
      <ZiweiChartDisplay
        birthData={{ year: 1990, month: 5, day: 15, hour: 10, gender: 'male' }}
        birthdayStr="1990-05-15"
        horoscopeDate={new Date()}
        onAnalyze={onAnalyze}
        onClearError={vi.fn()}
        generateFilename={generateZiweiFilename}
        t={(zh) => zh}
      />
    );
    fireEvent.click(screen.getByText('AI 命盘分析'));
    expect(onAnalyze).toHaveBeenCalledTimes(1);
  });

  it('should render AI interpretation', async () => {
    render(
      <ZiweiChartDisplay
        birthData={{ year: 1990, month: 5, day: 15, hour: 10, gender: 'male' }}
        birthdayStr="1990-05-15"
        horoscopeDate={new Date()}
        aiInterpretation="紫微解读结果"
        onAnalyze={vi.fn()}
        onClearError={vi.fn()}
        generateFilename={generateZiweiFilename}
        t={(zh) => zh}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('紫微解读结果')).toBeInTheDocument();
    });
  });
});

describe('ZiweiChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render page title', () => {
    render(<ZiweiChart />, { wrapper: TestWrapper });
    expect(screen.getByText('紫微斗数排盘')).toBeInTheDocument();
  });

  it('should generate chart and analyze', async () => {
    const api = await import('../../services/api');
    render(<ZiweiChart />, { wrapper: TestWrapper });

    // Close disclaimer modal
    fireEvent.click(screen.getByText('我已阅读并同意'));

    // Set birth data and generate chart
    fireEvent.click(screen.getByTestId('mock-birth-form'));
    fireEvent.click(screen.getByText('生成命盘'));

    await waitFor(() => {
      expect(screen.getByTestId('iztrolabe-mock')).toBeInTheDocument();
    });

    // Request AI analysis
    fireEvent.click(screen.getByText('AI 命盘分析'));
    await waitFor(() => {
      expect(api.default.getAIZiweiInterpretation).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('紫微解读结果')).toBeInTheDocument();
    });
  });
});
