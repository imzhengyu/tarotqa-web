import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import ScrollIndicator from '../../components/ScrollIndicator';

// 覆盖滚动监听：只有滚动超过 100px 且页面确实可滚动时才出现
describe('ScrollIndicator', () => {
  const setScroll = (scrollY, innerHeight, scrollHeight) => {
    Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: scrollHeight, configurable: true });
    window.dispatchEvent(new window.Event('scroll'));
  };

  it('滚动超过阈值且页面可滚动时显示', () => {
    const { container, unmount } = render(<ScrollIndicator />);

    act(() => setScroll(400, 800, 3000));
    expect(container.querySelector('.scroll-indicator')).toBeInTheDocument();

    act(() => setScroll(10, 800, 3000));
    expect(container.querySelector('.scroll-indicator')).toBeNull();
    unmount();
  });
});
