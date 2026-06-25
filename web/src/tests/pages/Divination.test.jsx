import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Divination, { generateTarotFilename, spreadList } from '../../pages/Divination';
import { LanguageProvider } from '../../context/LanguageContext';

const mockCards = [
  {
    id: 'fool',
    name: '愚者',
    nameEn: 'The Fool',
    description: '新的开始',
    reversedDescription: '鲁莽',
    localPath: 'cards/fool.webp',
    imageUrl: 'https://example.com/fool.jpg'
  },
  {
    id: 'magician',
    name: '魔术师',
    nameEn: 'The Magician',
    description: '创造力',
    reversedDescription: '欺骗',
    localPath: 'cards/magician.webp',
    imageUrl: 'https://example.com/magician.jpg'
  },
  {
    id: 'priestess',
    name: '女祭司',
    nameEn: 'The High Priestess',
    description: '直觉',
    reversedDescription: '秘密',
    localPath: 'cards/priestess.webp',
    imageUrl: 'https://example.com/priestess.jpg'
  }
];

vi.mock('../../services/api', () => ({
  default: {
    getCards: vi.fn(() => Promise.resolve(mockCards)),
    getRecommendedPersona: vi.fn(() => ({ name: '通用' })),
    getAIInterpretation: vi.fn(() => Promise.resolve('AI解读结果'))
  }
}));

vi.mock('../../hooks/useVisitStats', () => ({
  default: vi.fn(() => ({ incrementQuestionCount: vi.fn() }))
}));

vi.mock('../../hooks/useBackToTop', () => ({
  useBackToTop: vi.fn(() => ({ showBackToTop: false, scrollToTop: vi.fn() }))
}));

vi.mock('../../hooks/useAIRequestCooldown', () => ({
  useAIRequestCooldown: vi.fn(() => ({
    aiCooldown: 0,
    showCooldownToast: false,
    canMakeAIRequest: vi.fn(() => true),
    startCooldownTimer: vi.fn(),
    startCooldown: vi.fn()
  }))
}));

vi.mock('../../hooks/useIntersectionObserver', () => ({
  default: vi.fn(() => ({ elementRef: { current: null }, isIntersecting: true }))
}));

vi.mock('../../utils/export', () => ({
  exportToPNG: vi.fn(() => Promise.resolve())
}));

const TestWrapper = ({ children }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('generateTarotFilename', () => {
  it('should generate filename with spread name and card count', () => {
    const filename = generateTarotFilename('Three Cards', 3);
    expect(filename).toMatch(/^tarot-Three-Cards-3cards-/);
  });

  it('should handle missing spread name', () => {
    const filename = generateTarotFilename(null, 1);
    expect(filename).toMatch(/^tarot-reading-1cards-/);
  });
});

describe('spreadList', () => {
  it('should be an array with ids', () => {
    expect(Array.isArray(spreadList)).toBe(true);
    expect(spreadList.length).toBeGreaterThan(0);
    expect(spreadList[0]).toHaveProperty('id');
  });
});

describe('Divination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title', async () => {
    render(<Divination />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('占卜')).toBeInTheDocument();
    });
  });

  it('should render spread selection step', async () => {
    render(<Divination />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('选择牌阵')).toBeInTheDocument();
    });
  });

  it('should select a spread and proceed to question step', async () => {
    render(<Divination />, { wrapper: TestWrapper });
    await waitFor(() => {
      expect(screen.getByText('选择牌阵')).toBeInTheDocument();
    });

    const firstSpread = spreadList[0];
    fireEvent.click(screen.getByText(firstSpread.name));
    fireEvent.click(screen.getByText('选择此牌阵 →'));

    await waitFor(() => {
      expect(screen.getByText('描述您的问题')).toBeInTheDocument();
    });
  });

  it('should show alert when starting question without input', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<Divination />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('选择牌阵')).toBeInTheDocument();
    });

    const firstSpread = spreadList[0];
    fireEvent.click(screen.getByText(firstSpread.name));
    fireEvent.click(screen.getByText('选择此牌阵 →'));

    await waitFor(() => {
      expect(screen.getByText('描述您的问题')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('开始抽牌'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalled();
    }, { timeout: 1000 });
    alertSpy.mockRestore();
  });

  it('should complete full divination flow with single card spread', async () => {
    const api = await import('../../services/api');
    render(<Divination />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('选择牌阵')).toBeInTheDocument();
    });

    // Close disclaimer modal
    fireEvent.click(screen.getByText('我已阅读并同意'));

    // Select single card spread
    const singleSpread = spreadList.find(s => s.id === 'single');
    fireEvent.click(screen.getByText(singleSpread.name));
    fireEvent.click(screen.getByText('选择此牌阵 →'));

    await waitFor(() => {
      expect(screen.getByText('描述您的问题')).toBeInTheDocument();
    });

    // Enter question
    const textarea = screen.getByPlaceholderText('请描述您想要咨询的问题...');
    fireEvent.change(textarea, { target: { value: '我的运势如何？' } });

    // Start drawing
    fireEvent.click(screen.getByText('开始抽牌'));
    await waitFor(() => {
      expect(screen.getByText('点击卡牌抽取')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Draw card
    const deck = document.querySelector('.draw-cards .deck');
    fireEvent.click(deck);
    await waitFor(() => {
      expect(screen.getByText('占卜结果')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Request AI interpretation
    fireEvent.click(screen.getByText('AI深度解读'));
    await waitFor(() => {
      expect(api.default.getAIInterpretation).toHaveBeenCalled();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('AI 深度解读')).toBeInTheDocument();
    }, { timeout: 3000 });
  }, 20000);

  it('should reset divination', async () => {
    render(<Divination />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('选择牌阵')).toBeInTheDocument();
    });

    const singleSpread = spreadList.find(s => s.id === 'single');
    fireEvent.click(screen.getByText(singleSpread.name));
    fireEvent.click(screen.getByText('选择此牌阵 →'));

    await waitFor(() => {
      expect(screen.getByText('描述您的问题')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('返回'));
    await waitFor(() => {
      expect(screen.getByText('选择牌阵')).toBeInTheDocument();
    });
  });
});
