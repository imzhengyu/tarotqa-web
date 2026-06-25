import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '../../context/LanguageContext';
import LanguageContext from '../../context/LanguageContext';

function TestComponent() {
  const { language, setLanguage, toggleLanguage, t, isChinese, isEnglish } = useLanguage();
  return (
    <div>
      <span data-testid="language">{language}</span>
      <span data-testid="translated">{t('中文', 'English')}</span>
      <span data-testid="isChinese">{isChinese ? 'yes' : 'no'}</span>
      <span data-testid="isEnglish">{isEnglish ? 'yes' : 'no'}</span>
      <button onClick={toggleLanguage}>Toggle</button>
      <button onClick={() => setLanguage('en')}>Set English</button>
    </div>
  );
}

describe('LanguageProvider', () => {
  beforeEach(() => {
    localStorage.removeItem('tarotqa-language');
    document.documentElement.lang = '';
  });

  it('should default to zh when no saved language', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(screen.getByTestId('language').textContent).toBe('zh');
  });

  it('should read saved language from localStorage', () => {
    localStorage.setItem('tarotqa-language', 'en');
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(screen.getByTestId('language').textContent).toBe('en');
  });

  it('should translate based on language', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(screen.getByTestId('translated').textContent).toBe('中文');
  });

  it('should toggle language', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('language').textContent).toBe('en');
    expect(screen.getByTestId('translated').textContent).toBe('English');
  });

  it('should set language directly', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    fireEvent.click(screen.getByText('Set English'));
    expect(screen.getByTestId('language').textContent).toBe('en');
  });

  it('should update isChinese and isEnglish flags', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(screen.getByTestId('isChinese').textContent).toBe('yes');
    expect(screen.getByTestId('isEnglish').textContent).toBe('no');

    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('isChinese').textContent).toBe('no');
    expect(screen.getByTestId('isEnglish').textContent).toBe('yes');
  });

  it('should persist language to localStorage', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(localStorage.getItem('tarotqa-language')).toBe('en');
  });

  it('should set html lang attribute', () => {
    render(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );
    expect(document.documentElement.lang).toBe('zh-CN');
  });
});

describe('useLanguage', () => {
  it('should throw when used outside provider', () => {
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useLanguage must be used within a LanguageProvider');
  });
});

describe('LanguageContext', () => {
  it('should be defined', () => {
    expect(LanguageContext).toBeDefined();
  });
});
