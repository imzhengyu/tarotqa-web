import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  // 出生地改为「省市两级弹窗选择」，不再手输经纬度
  describe('出生地选择（星盘上升点用）', () => {
    const baseValue = { year: 2000, month: 1, day: 1, hour: 12, minute: 0, timezone: 'Asia/Shanghai' };
    const geo = {
      sourceUrl: 'https://download.geonames.org/export/dump/',
      provinces: [{ name: '广东省', cities: [{ name: '深圳市', lat: 22.5565, lon: 113.9859 }] }]
    };

    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => geo })));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('showLocation=false 时不显示出生地入口', () => {
      render(<BirthInfoForm value={baseValue} onChange={mockOnChange} />, { wrapper: TestWrapper });
      expect(screen.queryByText('选择省市')).not.toBeInTheDocument();
    });

    it('showLocation=true 时显示「选择省市」入口', () => {
      render(<BirthInfoForm value={baseValue} onChange={mockOnChange} showLocation />, { wrapper: TestWrapper });
      expect(screen.getByText('选择省市')).toBeInTheDocument();
    });

    it('通过省市弹窗选择后回传经纬度与出生地名称', async () => {
      render(<BirthInfoForm value={baseValue} onChange={mockOnChange} showLocation />, { wrapper: TestWrapper });

      fireEvent.click(screen.getByText('选择省市'));
      await waitFor(() => expect(screen.getByText('广东省')).toBeInTheDocument());
      fireEvent.click(screen.getByText('广东省'));
      await waitFor(() => expect(screen.getByText('深圳市')).toBeInTheDocument());
      fireEvent.click(screen.getByText('深圳市'));

      const payload = mockOnChange.mock.calls.at(-1)[0];
      expect(payload.latitude).toBe(22.5565);
      expect(payload.longitude).toBe(113.9859);
      expect(payload.birthplace).toMatchObject({ province: '广东省', city: '深圳市' });
    });

    it('已选择出生地时可清除', () => {
      const selected = {
        ...baseValue,
        latitude: 22.5565,
        longitude: 113.9859,
        birthplace: { province: '广东省', city: '深圳市', lat: 22.5565, lon: 113.9859 }
      };
      render(<BirthInfoForm value={selected} onChange={mockOnChange} showLocation />, { wrapper: TestWrapper });

      expect(screen.getByText('广东省 · 深圳市')).toBeInTheDocument();
      fireEvent.click(screen.getByText('清除'));

      const payload = mockOnChange.mock.calls.at(-1)[0];
      expect(payload.latitude).toBeUndefined();
      expect(payload.birthplace).toBeUndefined();
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
