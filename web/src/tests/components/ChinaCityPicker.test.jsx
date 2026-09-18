import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChinaCityPicker from '../../components/common/ChinaCityPicker';
import { LanguageProvider } from '../../context/LanguageContext';

const GEO = {
  sourceUrl: 'https://download.geonames.org/export/dump/',
  license: 'CC BY 4.0',
  provinces: [
    {
      name: '广东省',
      cities: [
        { name: '广州市', lat: 23.1167, lon: 113.25 },
        { name: '深圳市', lat: 22.5565, lon: 113.9859 }
      ]
    },
    { name: '北京市', cities: [{ name: '北京市', lat: 39.8906, lon: 116.4155 }] }
  ]
};

const Wrapper = ({ children }) => <LanguageProvider>{children}</LanguageProvider>;

describe('ChinaCityPicker', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => GEO })));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('两级级联：先选省，再选市，并把经纬度回传', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<ChinaCityPicker isOpen value={undefined} onSelect={onSelect} onClose={onClose} />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getByText('广东省')).toBeInTheDocument());
    expect(screen.getByText('请先选择省份')).toBeInTheDocument();

    fireEvent.click(screen.getByText('广东省'));
    await waitFor(() => expect(screen.getByText('深圳市')).toBeInTheDocument());
    // 只显示所选省份的城市：广州/深圳都在，但北京的城市不在城市列里
    expect(screen.getByText('广州市')).toBeInTheDocument();
    expect(screen.getAllByText('北京市')).toHaveLength(1); // 仅左侧省份列表里那一个

    fireEvent.click(screen.getByText('深圳市'));
    expect(onSelect).toHaveBeenCalledWith({ province: '广东省', city: '深圳市', lat: 22.5565, lon: 113.9859 });
    expect(onClose).toHaveBeenCalled();
  });

  it('显示 GeoNames 归属声明（CC BY 4.0 要求）', async () => {
    render(<ChinaCityPicker isOpen onSelect={vi.fn()} onClose={vi.fn()} />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText('GeoNames')).toBeInTheDocument());
    expect(screen.getByText(/CC BY 4\.0/)).toBeInTheDocument();
  });

  it('关闭状态下不渲染', () => {
    render(<ChinaCityPicker isOpen={false} onSelect={vi.fn()} onClose={vi.fn()} />, { wrapper: Wrapper });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('数据晚到 / 父组件重渲染都不会重置已选省份（竞态回归）', async () => {
    const onSelect = vi.fn();
    // 让 fetch 晚 80ms 才 resolve，复现"数据到了、用户已经点过省份"的时序
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => {
      setTimeout(() => resolve({ ok: true, json: async () => GEO }), 80);
    })));

    const { rerender } = render(
      <ChinaCityPicker isOpen value={undefined} onSelect={onSelect} onClose={vi.fn()} />,
      { wrapper: Wrapper }
    );
    await waitFor(() => expect(screen.getByText('广东省')).toBeInTheDocument());
    fireEvent.click(screen.getByText('广东省'));
    expect(screen.getByText('深圳市')).toBeInTheDocument();

    // 父组件用新的对象字面量重渲染（模拟 BirthInfoForm 每次 setState 都换引用）
    rerender(<ChinaCityPicker isOpen value={{ latitude: 1 }} onSelect={onSelect} onClose={vi.fn()} />);
    expect(screen.getByText('深圳市')).toBeInTheDocument();

    fireEvent.click(screen.getByText('深圳市'));
    expect(onSelect).toHaveBeenCalledWith({ province: '广东省', city: '深圳市', lat: 22.5565, lon: 113.9859 });
  });
});
