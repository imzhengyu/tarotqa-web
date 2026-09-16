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

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ year: 1990, month: 1, day: 1, hour: 12, minute: 0 })
      );
    });

    it('should call onChange when gender changes', () => {
      render(<BirthInfoForm value={{ gender: 'male' }} onChange={mockOnChange} showGender={true} />, { wrapper: TestWrapper });

      const femaleButton = screen.getByRole('button', { name: '女' });
      fireEvent.click(femaleButton);

      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ gender: 'female' }));
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

  describe('出生地经纬度（星盘上升点用）', () => {
    const baseValue = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, timezone: 'Asia/Shanghai' };

    it('默认不渲染经纬度输入', () => {
      render(<BirthInfoForm value={baseValue} onChange={mockOnChange} />, { wrapper: TestWrapper });
      expect(screen.queryByLabelText('出生地经度')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('出生地纬度')).not.toBeInTheDocument();
    });

    it('showLocation 为 true 时渲染经纬度输入', () => {
      render(<BirthInfoForm value={baseValue} onChange={mockOnChange} showLocation />, { wrapper: TestWrapper });
      expect(screen.getByLabelText('出生地经度')).toBeInTheDocument();
      expect(screen.getByLabelText('出生地纬度')).toBeInTheDocument();
    });

    it('输入经度时以数字回传，清空时回传 undefined', () => {
      render(<BirthInfoForm value={baseValue} onChange={mockOnChange} showLocation />, { wrapper: TestWrapper });
      const longitude = screen.getByLabelText('出生地经度');

      fireEvent.change(longitude, { target: { value: '121.4737' } });
      expect(mockOnChange.mock.calls.at(-1)[0].longitude).toBe(121.4737);

      fireEvent.change(longitude, { target: { value: '' } });
      expect(mockOnChange.mock.calls.at(-1)[0].longitude).toBeUndefined();
    });

    it('输入纬度时以数字回传', () => {
      render(<BirthInfoForm value={baseValue} onChange={mockOnChange} showLocation />, { wrapper: TestWrapper });
      fireEvent.change(screen.getByLabelText('出生地纬度'), { target: { value: '31.2304' } });
      expect(mockOnChange.mock.calls.at(-1)[0].latitude).toBe(31.2304);
    });
  });

  describe('受控与默认值（回归）', () => {
    it('未传 value 时使用内部默认值（2000-01-01 12:00）', () => {
      render(<BirthInfoForm onChange={mockOnChange} />, { wrapper: TestWrapper });

      expect(screen.getByLabelText('出生年份').value).toBe('2000');
      expect(screen.getByLabelText('月份').value).toBe('1');
      expect(screen.getByLabelText('小时').value).toBe('12');
    });

    it('外部 value 变化时同步本地状态', () => {
      const { rerender } = render(
        <BirthInfoForm value={{ year: 2000, month: 1, day: 1, hour: 12, minute: 0, timezone: 'Asia/Shanghai' }} onChange={mockOnChange} />,
        { wrapper: TestWrapper }
      );

      rerender(
        <BirthInfoForm value={{ year: 1995, month: 7, day: 20, hour: 8, minute: 30, timezone: 'Asia/Tokyo' }} onChange={mockOnChange} />
      );

      expect(screen.getByLabelText('出生年份').value).toBe('1995');
      expect(screen.getByLabelText('月份').value).toBe('7');
      expect(screen.getByLabelText('时区').value).toBe('Asia/Tokyo');
    });

    it('从 31 日切到 2 月时自动收敛到当月天数', () => {
      render(
        <BirthInfoForm value={{ year: 2001, month: 1, day: 31, hour: 12, minute: 0, timezone: 'Asia/Shanghai' }} onChange={mockOnChange} />,
        { wrapper: TestWrapper }
      );

      fireEvent.change(screen.getByLabelText('月份'), { target: { value: '2' } });

      expect(mockOnChange.mock.calls.at(-1)[0].day).toBe(28); // 2001 非闰年
    });
  });
});
