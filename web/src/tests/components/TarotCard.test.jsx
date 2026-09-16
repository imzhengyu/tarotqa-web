import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TarotCard from '../../components/TarotCard';
import { LanguageProvider } from '../../context/LanguageContext';

const Wrapper = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <LanguageProvider>{children}</LanguageProvider>
  </BrowserRouter>
);

const card = {
  id: 'world',
  name: '世界',
  nameEn: 'The World',
  localPath: 'tarot-images/major/21_World.webp',
  description: '完成',
  reversedDescription: '停滞',
  isReversed: true
};

// 覆盖图片懒加载状态机：pending → loading → loaded / error（原实现这几条分支没被测到）
describe('TarotCard 图片状态机', () => {
  it('图片加载成功后切到 loaded 态', async () => {
    render(<TarotCard card={card} faceUp />, { wrapper: Wrapper });

    const image = await screen.findByAltText('世界');
    fireEvent.load(image);

    await waitFor(() => expect(image.className).toContain('loaded'));
  });

  it('图片加载失败时显示中英双语的错误提示', async () => {
    render(<TarotCard card={card} faceUp />, { wrapper: Wrapper });

    const image = await screen.findByAltText('世界');
    fireEvent.error(image);

    expect(await screen.findByText('图片加载失败')).toBeInTheDocument();
  });

  it('翻面时加上 just-revealed 动效类，且逆位会旋转', async () => {
    const { container, rerender } = render(<TarotCard card={card} faceUp={false} />, { wrapper: Wrapper });
    rerender(<TarotCard card={card} faceUp />);

    await waitFor(() => expect(container.querySelector('.tarot-card')).toHaveClass('just-revealed'));
    expect(container.querySelector('.tarot-card')).toHaveClass('reversed');
  });

  it('动效结束后自动移除 just-revealed（覆盖定时器回调）', async () => {
    const { container } = render(<TarotCard card={card} faceUp />, { wrapper: Wrapper });

    await waitFor(
      () => expect(container.querySelector('.tarot-card')).not.toHaveClass('just-revealed'),
      { timeout: 2500 }
    );
  });
});
