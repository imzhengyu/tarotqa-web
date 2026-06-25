import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Cards from '../../pages/Cards';
import { LanguageProvider } from '../../context/LanguageContext';

const mockCards = [
  {
    id: 'fool',
    name: '愚者',
    nameEn: 'The_Fool',
    arcana: 'major',
    suit: null,
    description: '新的开始',
    keywords: ['冒险', '开始'],
    element: 'air',
    number: 0
  },
  {
    id: 'ace-wands',
    name: '权杖Ace',
    nameEn: 'Ace_of_Wands',
    arcana: 'minor',
    suit: 'wands',
    description: '创造力',
    keywords: ['灵感'],
    element: 'fire',
    number: 1
  },
  {
    id: 'two-cups',
    name: '圣杯二',
    nameEn: 'Two_of_Cups',
    arcana: 'minor',
    suit: 'cups',
    description: '关系',
    keywords: ['合作'],
    element: 'water',
    number: 2
  }
];

vi.mock('../../services/api', () => ({
  default: {
    getCards: vi.fn(() => Promise.resolve(mockCards))
  }
}));

vi.mock('../../hooks/useBackToTop', () => ({
  useBackToTop: vi.fn(() => ({ showBackToTop: false, scrollToTop: vi.fn() }))
}));

vi.mock('../../hooks/useIntersectionObserver', () => ({
  default: vi.fn(() => ({ elementRef: { current: null }, isIntersecting: true }))
}));

const TestWrapper = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title', async () => {
    render(<Cards />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('塔罗牌库')).toBeInTheDocument();
    });
  });

  it('should render search input and filter', async () => {
    render(<Cards />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByPlaceholderText('搜索塔罗牌...')).toBeInTheDocument();
      expect(screen.getByText('全部')).toBeInTheDocument();
    });
  });

  it('should render grouped cards', async () => {
    render(<Cards />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('大阿卡纳')).toBeInTheDocument();
      expect(screen.getByText('权杖')).toBeInTheDocument();
    });
  });

  it('should filter by search text', async () => {
    render(<Cards />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('愚者', { selector: '.card-info h3' })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索塔罗牌...');
    fireEvent.change(searchInput, { target: { value: '权杖' } });

    await waitFor(() => {
      expect(screen.queryByText('愚者', { selector: '.card-info h3' })).not.toBeInTheDocument();
      expect(screen.getByText('权杖Ace', { selector: '.card-info h3' })).toBeInTheDocument();
    });
  });

  it('should filter by arcana', async () => {
    render(<Cards />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('愚者', { selector: '.card-info h3' })).toBeInTheDocument();
    });

    const filterSelect = screen.getByDisplayValue('全部');
    fireEvent.change(filterSelect, { target: { value: 'minor' } });

    await waitFor(() => {
      expect(screen.queryByText('愚者', { selector: '.card-info h3' })).not.toBeInTheDocument();
      expect(screen.getByText('权杖Ace', { selector: '.card-info h3' })).toBeInTheDocument();
    });
  });

  it('should open and close card modal', async () => {
    render(<Cards />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('愚者', { selector: '.card-info h3' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('愚者', { selector: '.card-info h3' }));
    await waitFor(() => {
      expect(screen.getByText('关键词')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('关闭'));
    await waitFor(() => {
      expect(screen.queryByText('关键词')).not.toBeInTheDocument();
    });
  });
});
