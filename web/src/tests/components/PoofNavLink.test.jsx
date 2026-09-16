import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import PoofNavLink from '../../components/common/PoofNavLink';

const LocationDisplay = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

describe('PoofNavLink', () => {
  let originalDispatchEvent;

  beforeEach(() => {
    originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    window.dispatchEvent = originalDispatchEvent;
  });

  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <MemoryRouter>
          <PoofNavLink to="/test">Link Text</PoofNavLink>
        </MemoryRouter>
      );
      expect(screen.getByRole('link', { name: 'Link Text' })).toBeInTheDocument();
    });

    it('should have correct href', () => {
      render(
        <MemoryRouter>
          <PoofNavLink to="/divination">Tarot</PoofNavLink>
        </MemoryRouter>
      );
      expect(screen.getByRole('link')).toHaveAttribute('href', '/divination');
    });

    it('should apply custom className', () => {
      render(
        <MemoryRouter>
          <PoofNavLink to="/test" className="custom-link">Link</PoofNavLink>
        </MemoryRouter>
      );
      expect(screen.getByRole('link')).toHaveClass('custom-link');
    });

    it('should render as link element', () => {
      render(
        <MemoryRouter>
          <PoofNavLink to="/test">Link</PoofNavLink>
        </MemoryRouter>
      );
      expect(screen.getByRole('link')).toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    it('should apply active class when route matches', () => {
      render(
        <MemoryRouter initialEntries={['/divination']}>
          <PoofNavLink to="/divination" className={({ isActive }) => isActive ? 'active' : ''}>
            Tarot
          </PoofNavLink>
        </MemoryRouter>
      );
      expect(screen.getByRole('link')).toHaveClass('active');
    });

    it('should not apply active class when route does not match', () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <PoofNavLink to="/divination" className={({ isActive }) => isActive ? 'active' : ''}>
            Tarot
          </PoofNavLink>
        </MemoryRouter>
      );
      expect(screen.getByRole('link')).not.toHaveClass('active');
    });
  });

  describe('Poof Animation', () => {
    it('should dispatch poof event on click', () => {
      render(
        <MemoryRouter>
          <PoofNavLink to="/test">Link</PoofNavLink>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('link'));
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'poof',
          detail: expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number)
          })
        })
      );
    });

    it('should trigger btn-poof animation class', () => {
      render(
        <MemoryRouter>
          <PoofNavLink to="/test">Link</PoofNavLink>
        </MemoryRouter>
      );

      const link = screen.getByRole('link');
      fireEvent.click(link);
      expect(link).toHaveClass('btn-poof');
    });
  });

  describe('Navigation Behavior', () => {
    // 回归：原来这里是两条用例，一条只断言"还在首页"、另一条连断言都没有。
    // 现在直接断言导航结果：点击时先不跳，poof 动画（600ms）结束后跳到目标路由。
    it('点击先不跳转，动画结束后跳到目标路由', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <PoofNavLink to="/divination">Go to Divination</PoofNavLink>
          <LocationDisplay />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('link'));
      expect(screen.getByTestId('location')).toHaveTextContent('/');

      await waitFor(
        () => expect(screen.getByTestId('location')).toHaveTextContent('/divination'),
        { timeout: 2000 }
      );
    });
  });

  describe('poofEnabled prop', () => {
    it('should not dispatch poof event when poofEnabled is false', () => {
      render(
        <MemoryRouter>
          <PoofNavLink to="/test" poofEnabled={false}>Link</PoofNavLink>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('link'));
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
  });
});
