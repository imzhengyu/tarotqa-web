import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Icon, { ICON_PATHS } from '../../components/common/Icons';

describe('Icon', () => {
  it('所有注册的图标都能渲染成 1.5px 线性 SVG', () => {
    for (const name of Object.keys(ICON_PATHS)) {
      const { container, unmount } = render(<Icon name={name} size={18} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg.getAttribute('stroke-width')).toBe('1.5');
      expect(svg.getAttribute('width')).toBe('18');
      expect(svg.innerHTML.length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('未知图标名返回 null，不抛错', () => {
    const { container } = render(<Icon name="not-exist" />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
