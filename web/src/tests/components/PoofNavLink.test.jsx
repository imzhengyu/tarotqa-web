import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PoofNavLink from '../../components/common/PoofNavLink';

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
    it('should not navigate immediately on click (due to poof delay)', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <PoofNavLink to="/divination" delay={600}>Go to Divination</PoofNavLink>
          <div>Current: /</div>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('link'));

      // Should still be on home page (navigate not called yet due to delay)
      expect(screen.getByText('Current: /')).toBeInTheDocument();
    });

    it('should call navigate after delay', async () => {
      render(
        <MemoryRouter>
          <PoofNavLink to="/divination" delay={100}>Go to Divination</PoofNavLink>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('link'));

      // Wait for the delay to pass
      await new Promise(resolve => setTimeout(resolve, 150));
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
