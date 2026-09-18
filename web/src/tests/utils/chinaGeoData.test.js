import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { cwd } from 'node:process';

// jsdom 环境下 import.meta.url 是 http://localhost/...，不能直接喂给 readFileSync，
// 这里从 cwd 向上找 public/china-geo.json（vitest 的 cwd 是 web/）。
function findGeoFile() {
  let dir = cwd();
  for (let depth = 0; depth < 5; depth += 1) {
    const candidate = resolve(dir, 'public/china-geo.json');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('未找到 public/china-geo.json，请检查测试工作目录');
}

const raw = readFileSync(findGeoFile(), 'utf-8');
const geo = JSON.parse(raw);
const cities = geo.provinces.flatMap((province) => province.cities.map((city) => ({ ...city, province: province.name })));

// 44 个城市中心坐标（真实城区，非数据快照）：容差 0.5°，专门用于抓"行政区质心偏到别处"这类错误
const REFERENCE = [
  ['北京市', '北京市', 39.91, 116.4],
  ['上海市', '上海市', 31.22, 121.46],
  ['天津市', '天津市', 39.14, 117.18],
  ['重庆市', '重庆市', 29.56, 106.56],
  ['广东省', '广州市', 23.12, 113.25],
  ['广东省', '深圳市', 22.55, 114.07],
  ['广东省', '珠海市', 22.28, 113.57],
  ['浙江省', '杭州市', 30.29, 120.16],
  ['浙江省', '宁波市', 29.88, 121.55],
  ['江苏省', '南京市', 32.06, 118.78],
  ['江苏省', '苏州市', 31.3, 120.6],
  ['山东省', '青岛市', 36.06, 120.38],
  ['山东省', '济南市', 36.67, 117.0],
  ['福建省', '厦门市', 24.48, 118.09],
  ['福建省', '福州市', 26.06, 119.31],
  ['四川省', '成都市', 30.67, 104.07],
  ['四川省', '绵阳市', 31.47, 104.68],
  ['湖北省', '武汉市', 30.58, 114.27],
  ['湖北省', '宜昌市', 30.71, 111.28],
  ['湖南省', '长沙市', 28.2, 112.97],
  ['河南省', '郑州市', 34.76, 113.65],
  ['河北省', '石家庄市', 38.04, 114.48],
  ['山西省', '太原市', 37.87, 112.56],
  ['陕西省', '西安市', 34.26, 108.93],
  ['甘肃省', '兰州市', 36.06, 103.84],
  ['青海省', '西宁市', 36.63, 101.76],
  ['辽宁省', '沈阳市', 41.79, 123.43],
  ['辽宁省', '大连市', 38.91, 121.6],
  ['吉林省', '长春市', 43.88, 125.32],
  ['黑龙江省', '哈尔滨市', 45.75, 126.65],
  ['安徽省', '合肥市', 31.86, 117.28],
  ['江西省', '南昌市', 28.68, 115.85],
  ['贵州省', '贵阳市', 26.58, 106.72],
  ['云南省', '昆明市', 25.04, 102.72],
  ['广西壮族自治区', '南宁市', 22.82, 108.32],
  ['广西壮族自治区', '桂林市', 25.28, 110.3],
  ['内蒙古自治区', '呼和浩特市', 40.81, 111.65],
  ['新疆维吾尔自治区', '乌鲁木齐市', 43.8, 87.6],
  ['西藏自治区', '拉萨市', 29.65, 91.1],
  ['海南省', '海口市', 20.03, 110.35],
  ['宁夏回族自治区', '银川市', 38.47, 106.27],
  ['香港特别行政区', '香港', 22.32, 114.17],
  ['澳门特别行政区', '澳门', 22.2, 113.54],
  ['台湾省', '台北', 25.03, 121.57],
];

describe('china-geo.json（省市经纬度数据）', () => {
  it('包含 34 个省级单位与足够的地级市', () => {
    expect(geo.provinces).toHaveLength(34);
    expect(cities.length).toBeGreaterThanOrEqual(330);
  });

  it('每个省都有城市，名字是中文且不重复', () => {
    const provinceNames = geo.provinces.map((province) => province.name);
    expect(new Set(provinceNames).size).toBe(provinceNames.length);

    for (const province of geo.provinces) {
      expect(province.cities.length).toBeGreaterThan(0);
      expect(province.name).toMatch(/^[\u4e00-\u9fff]{2,}$/);
      for (const city of province.cities) {
        expect(city.name).toMatch(/^[\u4e00-\u9fff]{2,}$/);
        expect(city.lat).toBeGreaterThan(3);      // 中国大陆纬度范围
        expect(city.lat).toBeLessThan(54);
        expect(city.lon).toBeGreaterThan(73);
        expect(city.lon).toBeLessThan(136);
      }
    }
  });

  it.each(REFERENCE)('%s / %s 坐标接近真实城区（误差 < 0.5°）', (provinceName, cityName, lat, lon) => {
    const province = geo.provinces.find((item) => item.name === provinceName);
    expect(province, `缺少省级单位 ${provinceName}`).toBeTruthy();
    const city = province.cities.find((item) => item.name === cityName);
    expect(city, `缺少城市 ${provinceName}/${cityName}`).toBeTruthy();
    expect(city.lat).toBeCloseTo(lat, 0);
    expect(city.lon).toBeCloseTo(lon, 0);
  });

  it('抽查表本身有 40 个以上城市，且省名都存在于数据中', () => {
    expect(REFERENCE.length).toBeGreaterThanOrEqual(40);
    const provinceNames = new Set(geo.provinces.map((item) => item.name));
    const unknown = REFERENCE.map(([provinceName]) => provinceName).filter((name) => !provinceNames.has(name));
    expect(unknown).toEqual([]);
  });

  it('带许可与来源信息（CC BY 4.0 归属要求）', () => {
    expect(geo.license).toBe('CC BY 4.0');
    expect(geo.source).toMatch(/GeoNames/);
    expect(geo.attribution).toMatch(/GeoNames/);
  });
});
