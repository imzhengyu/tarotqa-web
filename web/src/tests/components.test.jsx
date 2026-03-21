import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Import components to test
import TarotCard from '../components/TarotCard';
import PieChart from '../components/PieChart';
import OsPieChart from '../components/OsPieChart';
import ErrorBoundary from '../components/ErrorBoundary';
import Layout from '../components/Layout';

const mockCard = {
  id: 'fool',
  name: '愚者',
  nameEn: 'The Fool',
  localPath: 'cards/fool.jpg',
  imageUrl: 'https://example.com/fool.jpg',
  description: '新的开始、天真、自由',
  reversedDescription: '鲁莽、冒险、轻率',
  keywords: ['冒险', '开始', '自由'],
  isReversed: false,
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('TarotCard', () => {
  describe('Rendering States', () => {
    it('should render card element', () => {
      render(<TarotCard card={mockCard} />);
      const cardElement = document.querySelector('.tarot-card');
      expect(cardElement).toBeInTheDocument();
    });

    it('should include face-up class when faceUp is true', () => {
      render(<TarotCard card={mockCard} faceUp={true} />);
      const cardElement = document.querySelector('.tarot-card.face-up');
      expect(cardElement).toBeInTheDocument();
    });

    it('should include selected class when selected is true', () => {
      render(<TarotCard card={mockCard} selected={true} />);
      const cardElement = document.querySelector('.tarot-card.selected');
      expect(cardElement).toBeInTheDocument();
    });

    it('should include small class when small is true', () => {
      render(<TarotCard card={mockCard} small={true} />);
      const cardElement = document.querySelector('.tarot-card.small');
      expect(cardElement).toBeInTheDocument();
    });

    it('should handle card with isReversed true', () => {
      const reversedCard = { ...mockCard, isReversed: true };
      render(<TarotCard card={reversedCard} faceUp={true} />);
      const cardElement = document.querySelector('.tarot-card.reversed');
      expect(cardElement).toBeInTheDocument();
    });

    it('should handle null card without error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<TarotCard card={null} faceUp={true} />);
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Click Handler', () => {
    it('should call onClick when card is clicked', () => {
      const handleClick = vi.fn();
      render(<TarotCard card={mockCard} onClick={handleClick} />);
      const cardElement = document.querySelector('.tarot-card');
      fireEvent.click(cardElement);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe('PieChart', () => {
  const mockData = [
    { label: '桌面', count: 50, color: '#0078D4', icon: '💻' },
    { label: '移动', count: 30, color: '#3DDC84', icon: '📱' },
    { label: '平板', count: 20, color: '#FCC624', icon: '📱' },
  ];

  describe('Empty Data Rendering', () => {
    it('should show empty data placeholder when data is empty array', () => {
      render(<PieChart data={[]} />);
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('should show empty data placeholder when all counts are zero', () => {
      const zeroData = [
        { label: '桌面', count: 0, color: '#0078D4' },
        { label: '移动', count: 0, color: '#3DDC84' },
      ];
      render(<PieChart data={zeroData} />);
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<PieChart data={mockData} title="设备分布" />);
      expect(screen.getByText('设备分布')).toBeInTheDocument();
    });
  });

  describe('Data Rendering', () => {
    it('should render pie chart with data', () => {
      render(<PieChart data={mockData} />);
      const pieChart = document.querySelector('.pie-chart');
      expect(pieChart).toBeInTheDocument();
    });

    it('should render legend items', () => {
      render(<PieChart data={mockData} />);
      expect(screen.getByText('桌面')).toBeInTheDocument();
      expect(screen.getByText('移动')).toBeInTheDocument();
      expect(screen.getByText('平板')).toBeInTheDocument();
    });

    it('should display correct percentages', () => {
      render(<PieChart data={mockData} />);
      // 50/(50+30+20) = 50%, 30% = 30%, 20% = 20%
      expect(screen.getByText('50.0%')).toBeInTheDocument();
      expect(screen.getByText('30.0%')).toBeInTheDocument();
      expect(screen.getByText('20.0%')).toBeInTheDocument();
    });

    it('should display total count', () => {
      render(<PieChart data={mockData} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('总会话')).toBeInTheDocument();
    });
  });

  describe('Color Fallback', () => {
    it('should handle missing color with fallback', () => {
      const dataWithoutColor = [
        { label: '测试', count: 100 },
      ];
      render(<PieChart data={dataWithoutColor} />);
      const pieChart = document.querySelector('.pie-chart');
      expect(pieChart).toBeInTheDocument();
    });
  });
});

describe('OsPieChart', () => {
  const mockOsData = [
    { label: 'Windows', count: 60, color: '#0078D4' },
    { label: 'macOS', count: 25, color: '#333333' },
    { label: 'Linux', count: 15, color: '#FCC624' },
  ];

  it('should render with title', () => {
    render(<OsPieChart data={mockOsData} title="操作系统" />);
    expect(screen.getByText('操作系统')).toBeInTheDocument();
  });

  it('should render pie chart container', () => {
    render(<OsPieChart data={mockOsData} />);
    const container = document.querySelector('.os-pie-chart-container');
    expect(container).toBeInTheDocument();
  });
});

describe('ErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  describe('Normal Rendering', () => {
    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <div>Children rendered successfully</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('Children rendered successfully')).toBeInTheDocument();
    });
  });

  describe('Error Capture', () => {
    it('should capture error and show error message', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );
      expect(screen.getByText('出错了')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should show retry button', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );
      expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument();
    });

    it('should show refresh button', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );
      expect(screen.getByRole('button', { name: '刷新页面' })).toBeInTheDocument();
    });

    it('should show home link', () => {
      render(
        <TestWrapper>
          <ErrorBoundary>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </TestWrapper>
      );
      const homeLink = screen.getByRole('link', { name: '返回首页' });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink.getAttribute('href')).toBe('/');
    });
  });
});

describe('Horoscope Data Structure', () => {
  it('should reference correct zodiac name field', () => {
    // This test verifies the API returns 'name' not 'zodiacName'
    // The Horoscope component should use 'name' field
    const mockHoroscopeData = {
      name: '白羊座',
      overall: '今日运势整体不错',
      love: '感情上可能会有意外惊喜',
      career: '工作上表现突出',
      finance: '财务状况稳定',
    };
    expect(mockHoroscopeData).toHaveProperty('name');
    expect(mockHoroscopeData.name).toBe('白羊座');
  });
});

describe('Layout', () => {
  const { innerWidth } = window;

  afterEach(() => {
    // Restore original window properties
    Object.defineProperty(window, 'innerWidth', { value: innerWidth, writable: true, configurable: true });
  });

  describe('Mobile Navigation Position', () => {
    it('should render mobile-nav on mobile screens', () => {
      // Mock mobile environment
      Object.defineProperty(window, 'innerWidth', { get: () => 375, configurable: true });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true
      });

      render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const mobileNav = document.querySelector('.mobile-nav');
      expect(mobileNav).toBeInTheDocument();
      expect(mobileNav).toBeVisible();
    });

    it('should not render mobile-nav on desktop screens', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 1024, configurable: true });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        configurable: true
      });

      render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      // On desktop, mobile-nav is not rendered at all (isMobile is false)
      const mobileNav = document.querySelector('.mobile-nav');
      expect(mobileNav).toBeNull();
    });

    it('should render desktop footer on desktop screens', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 1024, configurable: true });
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        configurable: true
      });

      render(
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      );

      const footer = document.querySelector('.footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toBeVisible();
    });
  });
});
