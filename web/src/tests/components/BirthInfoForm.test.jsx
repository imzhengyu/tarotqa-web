import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BirthInfoForm from '../../components/common/BirthInfoForm';
import { LanguageProvider } from '../../context/LanguageContext';

const TestWrapper = ({ children }) => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <LanguageProvider>{children}</LanguageProvider>
  </BrowserRouter>
);

describe('BirthInfoForm', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<BirthInfoForm value={{}} onChange={mockOnChange} />, { wrapper: TestWrapper });

      expect(screen.getByLabelText('出生年份')).toBeInTheDocument();
      expect(screen.getByLabelText('月份')).toBeInTheDocument();
      expect(screen.getByLabelText('日期')).toBeInTheDocument();
      expect(screen.getByLabelText('小时')).toBeInTheDocument();
      expect(screen.getByLabelText('分钟')).toBeInTheDocument();
      expect(screen.getByLabelText('时区')).toBeInTheDocument();
    });

    it('should render gender buttons when showGender is true', () => {
      render(<BirthInfoForm value={{}} onChange={mockOnChange} showGender={true} />, { wrapper: TestWrapper });
      expect(screen.getByRole('button', { name: '男' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '女' })).toBeInTheDocument();
    });

    it('should not render gender buttons when showGender is false', () => {
      render(<BirthInfoForm value={{}} onChange={mockOnChange} showGender={false} />, { wrapper: TestWrapper });
      expect(screen.queryByRole('button', { name: '男' })).not.toBeInTheDocument();
    });
  });

  describe('onChange callback', () => {
    it('should call onChange when year changes', () => {
      render(<BirthInfoForm value={{ year: 2000, month: 1, day: 1, hour: 12, minute: 0, timezone: 'Asia/Shanghai' }} onChange={mockOnChange} />, { wrapper: TestWrapper });

      const yearSelect = screen.getByLabelText('出生年份');
      fireEvent.change(yearSelect, { target: { value: '1990' } });

      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls[0][0].year).toBe(1990);
    });

    it('should call onChange when gender changes', () => {
      render(<BirthInfoForm value={{ gender: 'male' }} onChange={mockOnChange} showGender={true} />, { wrapper: TestWrapper });

      const femaleButton = screen.getByRole('button', { name: '女' });
      fireEvent.click(femaleButton);

      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange.mock.calls[0][0].gender).toBe('female');
    });
  });

  describe('Date handling edge cases', () => {
    it('should adjust days when switching from January to April (31 -> 30)', () => {
      const initialValue = {
        year: 2000,
        month: 1,
        day: 31,
        hour: 12,
        minute: 0,
        timezone: 'Asia/Shanghai'
      };

      render(<BirthInfoForm value={initialValue} onChange={mockOnChange} />, { wrapper: TestWrapper });

      const monthSelect = screen.getByLabelText('月份');
      fireEvent.change(monthSelect, { target: { value: 4 } });

      expect(mockOnChange.mock.calls[0][0].day).toBe(30);
    });

    it('should handle February in leap year correctly (29 days)', () => {
      const initialValue = {
        year: 2000,
        month: 1,
        day: 31,
        hour: 12,
        minute: 0,
        timezone: 'Asia/Shanghai'
      };

      render(<BirthInfoForm value={initialValue} onChange={mockOnChange} />, { wrapper: TestWrapper });

      const monthSelect = screen.getByLabelText('月份');
      fireEvent.change(monthSelect, { target: { value: 2 } });

      expect(mockOnChange.mock.calls[0][0].day).toBe(29);
    });
  });

  describe('Timezone', () => {
    it('should default timezone to Asia/Shanghai if not provided', () => {
      const initialValue = {
        year: 2000,
        month: 1,
        day: 1,
        hour: 12,
        minute: 0,
        timezone: 'Asia/Shanghai'
      };

      render(<BirthInfoForm value={initialValue} onChange={mockOnChange} />, { wrapper: TestWrapper });

      const timezoneSelect = screen.getByLabelText('时区');
      expect(timezoneSelect.value).toBe('Asia/Shanghai');
    });
  });
});
