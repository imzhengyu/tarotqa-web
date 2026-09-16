import { describe, it, expect } from 'vitest';
import { AstroTime, Body, GeoVector, Ecliptic, SiderealTime } from 'astronomy-engine';
import {
  calculateAstrologyChart,
  calculatePlanets,
  calculateAscendantMC,
  calculateHouses,
  formatBirthTime,
  createAstroTime,
  DEFAULT_OBSERVER,
  HOUSE_SYSTEM,
  OBLIQUITY_DEGREES
} from '../../../utils/astrology/calculations';
import { ZODIAC_SIGNS, HOUSES } from '../../../utils/astrology/constants';

const validBirthData = {
  year: 2000,
  month: 8,
  day: 16,
  hour: 14,
  minute: 30,
  timezone: 'Asia/Shanghai'
};

describe('Astrology Calculations', () => {
  describe('calculatePlanets', () => {
    it('should return all planet ids', () => {
      const planets = calculatePlanets(validBirthData);
      const planetIds = planets.map(p => p.id);
      expect(planetIds).toEqual([
        'sun', 'moon', 'mercury', 'venus', 'mars',
        'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'
      ]);
    });

    it('should calculate sun position correctly using GeoVector+Ecliptic', () => {
      const planets = calculatePlanets(validBirthData);
      const sun = planets.find(p => p.id === 'sun');
      expect(sun).toBeDefined();
      expect(sun.longitude).toBeGreaterThan(0);
      expect(sun.longitude).toBeLessThan(360);
      expect(sun.sign).toBeDefined();
      expect(sun.sign.id).toBe('leo');
      expect(sun.degree).toBeGreaterThan(0);
      expect(sun.degree).toBeLessThan(30);
    });

    it('should calculate moon position correctly', () => {
      const planets = calculatePlanets(validBirthData);
      const moon = planets.find(p => p.id === 'moon');
      expect(moon).toBeDefined();
      expect(moon.longitude).toBeGreaterThan(0);
      expect(moon.longitude).toBeLessThan(360);
      expect(moon.sign).toBeDefined();
    });

    it('should calculate all inner planets', () => {
      const planets = calculatePlanets(validBirthData);
      const inner = ['sun', 'moon', 'mercury', 'venus', 'mars'];
      inner.forEach(id => {
        const planet = planets.find(p => p.id === id);
        expect(planet).toBeDefined();
        expect(planet.longitude).toBeGreaterThan(0);
        expect(planet.longitude).toBeLessThan(360);
      });
    });

    it('should calculate all outer planets', () => {
      const planets = calculatePlanets(validBirthData);
      const outer = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
      outer.forEach(id => {
        const planet = planets.find(p => p.id === id);
        expect(planet).toBeDefined();
        expect(planet.longitude).toBeGreaterThan(0);
        expect(planet.longitude).toBeLessThan(360);
      });
    });

    it('each planet should have ra and dec fields', () => {
      const planets = calculatePlanets(validBirthData);
      planets.forEach(planet => {
        expect(planet).toHaveProperty('ra');
        expect(planet).toHaveProperty('dec');
      });
    });

    it('each planet should have valid zodiac sign from ZODIAC_SIGNS', () => {
      const planets = calculatePlanets(validBirthData);
      planets.forEach(planet => {
        const validSign = ZODIAC_SIGNS.find(s => s.id === planet.sign.id);
        expect(validSign).toBeDefined();
        expect(planet.sign.name).toBe(validSign.name);
        expect(planet.sign.symbol).toBe(validSign.symbol);
      });
    });

    it('each planet degree should be between 0 and 30', () => {
      const planets = calculatePlanets(validBirthData);
      planets.forEach(planet => {
        expect(planet.degree).toBeGreaterThanOrEqual(0);
        expect(planet.degree).toBeLessThan(30);
      });
    });

    it('sun position should change with different dates', () => {
      const data1 = { year: 2000, month: 8, day: 16, hour: 14, minute: 30, timezone: 'Asia/Shanghai' };
      const data2 = { year: 1990, month: 1, day: 1, hour: 0, minute: 0, timezone: 'Asia/Shanghai' };
      const data3 = { year: 2020, month: 6, day: 21, hour: 12, minute: 0, timezone: 'Asia/Shanghai' };

      const planets1 = calculatePlanets(data1);
      const planets2 = calculatePlanets(data2);
      const planets3 = calculatePlanets(data3);

      const sun1 = planets1.find(p => p.id === 'sun');
      const sun2 = planets2.find(p => p.id === 'sun');
      const sun3 = planets3.find(p => p.id === 'sun');

      expect(sun1.longitude).not.toBe(sun2.longitude);
      expect(sun2.longitude).not.toBe(sun3.longitude);
      expect(sun1.longitude).not.toBe(sun3.longitude);
    });

    it('moon position should change with different times', () => {
      const data1 = { year: 2000, month: 8, day: 16, hour: 14, minute: 30, timezone: 'Asia/Shanghai' };
      const data2 = { year: 2000, month: 8, day: 16, hour: 20, minute: 45, timezone: 'Asia/Shanghai' };

      const planets1 = calculatePlanets(data1);
      const planets2 = calculatePlanets(data2);

      const moon1 = planets1.find(p => p.id === 'moon');
      const moon2 = planets2.find(p => p.id === 'moon');

      expect(moon1.longitude).not.toBe(moon2.longitude);
    });

    it('同一时刻的不同时区写法应给出完全相同的行星位置', () => {
      const shanghai = { year: 2000, month: 8, day: 16, hour: 14, minute: 30, timezone: 'Asia/Shanghai' };
      const utc = { year: 2000, month: 8, day: 16, hour: 6, minute: 30, timezone: 'UTC' };
      const newYork = { year: 2000, month: 8, day: 16, hour: 2, minute: 30, timezone: 'America/New_York' };

      const [cst, gmt, ny] = [shanghai, utc, newYork].map(data =>
        calculatePlanets(data).map(planet => planet.longitude)
      );

      expect(cst).toHaveLength(10);
      cst.forEach((longitude, index) => {
        expect(gmt[index]).toBeCloseTo(longitude, 6);
        expect(ny[index]).toBeCloseTo(longitude, 6);
      });
    });
  });

  describe('calculateAscendantMC', () => {
    it('should return ascendant and midheaven', () => {
      const result = calculateAscendantMC(validBirthData);
      expect(result).toHaveProperty('ascendant');
      expect(result).toHaveProperty('midheaven');
    });

    it('上升点与中天的星座都应来自 ZODIAC_SIGNS 且度数合法', () => {
      const { ascendant, midheaven } = calculateAscendantMC(validBirthData);

      [ascendant, midheaven].forEach(point => {
        const validSign = ZODIAC_SIGNS.find(s => s.id === point.sign.id);
        expect(validSign).toBeDefined();
        expect(point.sign.name).toBe(validSign.name);
        expect(point.degree).toBeGreaterThanOrEqual(0);
        expect(point.degree).toBeLessThan(30);
      });
    });

    it('ascendant longitude should be 0-360', () => {
      const result = calculateAscendantMC(validBirthData);
      expect(result.ascendant.longitude).toBeGreaterThanOrEqual(0);
      expect(result.ascendant.longitude).toBeLessThan(360);
    });

    it('midheaven longitude should be 0-360', () => {
      const result = calculateAscendantMC(validBirthData);
      expect(result.midheaven.longitude).toBeGreaterThanOrEqual(0);
      expect(result.midheaven.longitude).toBeLessThan(360);
    });

    it('ascendant and midheaven should be different', () => {
      const result = calculateAscendantMC(validBirthData);
      expect(result.ascendant.longitude).not.toBe(result.midheaven.longitude);
    });

    it('should change with different times', () => {
      const data1 = { year: 2000, month: 8, day: 16, hour: 14, minute: 30 };
      const data2 = { year: 2000, month: 8, day: 16, hour: 20, minute: 45 };

      const result1 = calculateAscendantMC(data1);
      const result2 = calculateAscendantMC(data2);

      expect(result1.ascendant.longitude).not.toBe(result2.ascendant.longitude);
      expect(result1.midheaven.longitude).not.toBe(result2.midheaven.longitude);
    });
  });

  describe('calculateHouses', () => {
    const { ascendant } = calculateAscendantMC(validBirthData);

    it('should return 12 houses', () => {
      const houses = calculateHouses(ascendant);
      expect(houses).toHaveLength(12);
    });

    it('each house should have required fields', () => {
      const houses = calculateHouses(ascendant);
      houses.forEach(house => {
        expect(house).toHaveProperty('id');
        expect(house).toHaveProperty('name');
        expect(house).toHaveProperty('longitude');
        expect(house).toHaveProperty('sign');
        expect(house).toHaveProperty('degree');
      });
    });

    it('house ids should be 1-12', () => {
      const houses = calculateHouses(ascendant);
      const ids = houses.map(h => h.id);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('house names should match HOUSES constant', () => {
      const houses = calculateHouses(ascendant);
      houses.forEach((house, index) => {
        expect(house.name).toBe(HOUSES[index].name);
      });
    });

    it('每宫的黄经、度数与星座都应合法', () => {
      const houses = calculateHouses(ascendant);
      const signIds = ZODIAC_SIGNS.map(sign => sign.id);

      houses.forEach(house => {
        expect(house.longitude).toBeGreaterThanOrEqual(0);
        expect(house.longitude).toBeLessThan(360);
        expect(house.degree).toBeGreaterThanOrEqual(0);
        expect(house.degree).toBeLessThan(30);
        expect(signIds).toContain(house.sign.id);
      });
    });

    it('houses should be approximately 30 degrees apart', () => {
      const houses = calculateHouses(ascendant);
      for (let i = 1; i < houses.length; i++) {
        const diff = (houses[i].longitude - houses[i - 1].longitude + 360) % 360;
        expect(diff).toBeGreaterThan(25);
        expect(diff).toBeLessThan(35);
      }
    });
  });

  describe('calculateAspects', () => {
    it('should return array', () => {
      const chart = calculateAstrologyChart(validBirthData);
      expect(Array.isArray(chart.aspects)).toBe(true);
    });

    it('each aspect should have required fields', () => {
      const chart = calculateAstrologyChart(validBirthData);
      chart.aspects.forEach(aspect => {
        expect(aspect).toHaveProperty('planet1');
        expect(aspect).toHaveProperty('planet2');
        expect(aspect).toHaveProperty('type');
        expect(aspect).toHaveProperty('angle');
        expect(aspect).toHaveProperty('orb');
        expect(aspect).toHaveProperty('exact');
      });
    });

    it('aspect type should be valid', () => {
      const chart = calculateAstrologyChart(validBirthData);
      const validTypes = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];
      chart.aspects.forEach(aspect => {
        expect(validTypes).toContain(aspect.type);
      });
    });

    it('orb 非负，且 exact 与 orb <= 2 的判定一致', () => {
      const chart = calculateAstrologyChart(validBirthData);
      expect(chart.aspects.length).toBeGreaterThan(0);

      chart.aspects.forEach(aspect => {
        expect(aspect.orb).toBeGreaterThanOrEqual(0);
        expect(aspect.exact).toBe(aspect.orb <= 2);
      });
    });

    it('no duplicate aspect pairs', () => {
      const chart = calculateAstrologyChart(validBirthData);
      const pairs = chart.aspects.map(a => [a.planet1, a.planet2].sort().join('-'));
      const uniquePairs = new Set(pairs);
      expect(pairs.length).toBe(uniquePairs.size);
    });

    it('aspect angle should match type approximately', () => {
      const chart = calculateAstrologyChart(validBirthData);
      const angleMap = {
        conjunction: 0,
        opposition: 180,
        trine: 120,
        square: 90,
        sextile: 60
      };
      chart.aspects.forEach(aspect => {
        const expected = angleMap[aspect.type];
        const diff = Math.abs(aspect.angle - expected);
        expect(diff).toBeLessThan(15);
      });
    });

    it('no self-aspects', () => {
      const chart = calculateAstrologyChart(validBirthData);
      chart.aspects.forEach(aspect => {
        expect(aspect.planet1).not.toBe(aspect.planet2);
      });
    });
  });

  describe('calculateAstrologyChart - full chart generation', () => {
    it('完整星盘结构：10 颗行星 / 12 宫 / 上升中天 / 相位 / 出生数据', () => {
      const chart = calculateAstrologyChart(validBirthData);

      expect(chart).toHaveProperty('planets');
      expect(chart).toHaveProperty('ascendant');
      expect(chart).toHaveProperty('midheaven');
      expect(chart).toHaveProperty('houses');
      expect(chart).toHaveProperty('aspects');
      expect(chart).toHaveProperty('birthData');
      expect(chart.planets).toHaveLength(10);
      expect(chart.houses).toHaveLength(12);
      expect(chart.houseSystem).toBe('equal');
      expect(chart.birthData).toEqual(validBirthData);
      expect(chart.planets.map(p => p.id)).toEqual(
        expect.arrayContaining(['sun', 'moon', 'jupiter', 'saturn', 'pluto'])
      );
    });

    it('each planet should have required fields', () => {
      const chart = calculateAstrologyChart(validBirthData);
      const planet = chart.planets[0];

      expect(planet).toHaveProperty('id');
      expect(planet).toHaveProperty('name');
      expect(planet).toHaveProperty('symbol');
      expect(planet).toHaveProperty('longitude');
      expect(planet).toHaveProperty('sign');
      expect(planet).toHaveProperty('degree');
    });

    it('each planet should have valid zodiac sign', () => {
      const chart = calculateAstrologyChart(validBirthData);

      chart.planets.forEach(planet => {
        expect(planet.sign).toBeDefined();
        expect(ZODIAC_SIGNS).toContainEqual(expect.objectContaining({
          id: planet.sign.id,
          name: planet.sign.name
        }));
      });
    });

    it('each house should have required fields', () => {
      const chart = calculateAstrologyChart(validBirthData);
      const house = chart.houses[0];

      expect(house).toHaveProperty('id');
      expect(house).toHaveProperty('name');
      expect(house).toHaveProperty('longitude');
      expect(house).toHaveProperty('sign');
    });

    it('different dates should produce different charts', () => {
      const data1 = { year: 2000, month: 8, day: 16, hour: 14, minute: 30, timezone: 'Asia/Shanghai' };
      const data2 = { year: 1995, month: 3, day: 5, hour: 9, minute: 15, timezone: 'Asia/Shanghai' };

      const chart1 = calculateAstrologyChart(data1);
      const chart2 = calculateAstrologyChart(data2);

      const sun1 = chart1.planets.find(p => p.id === 'sun');
      const sun2 = chart2.planets.find(p => p.id === 'sun');

      expect(sun1.longitude).not.toBe(sun2.longitude);
      expect(chart1.ascendant.longitude).not.toBe(chart2.ascendant.longitude);
    });
  });

  describe('formatBirthTime', () => {
    it('should format time correctly', () => {
      const data = { hour: 14, minute: 30 };
      expect(formatBirthTime(data)).toBe('14:30');
    });

    it('should pad single digit hour', () => {
      const data = { hour: 9, minute: 5 };
      expect(formatBirthTime(data)).toBe('09:05');
    });

    it('should pad single digit minute', () => {
      const data = { hour: 12, minute: 3 };
      expect(formatBirthTime(data)).toBe('12:03');
    });

    it('should handle midnight', () => {
      const data = { hour: 0, minute: 0 };
      expect(formatBirthTime(data)).toBe('00:00');
    });

    it('should handle 23:59', () => {
      const data = { hour: 23, minute: 59 };
      expect(formatBirthTime(data)).toBe('23:59');
    });
  });

  describe('角度归一化', () => {
    it('所有黄经都应是 [0,360) 内的有限数', () => {
      const chart = calculateAstrologyChart(validBirthData);
      const longitudes = [
        ...chart.planets.map(planet => planet.longitude),
        chart.ascendant.longitude,
        chart.midheaven.longitude,
        ...chart.houses.map(house => house.longitude)
      ];

      expect(longitudes).toHaveLength(24);
      longitudes.forEach(longitude => {
        expect(Number.isFinite(longitude)).toBe(true);
        expect(longitude).toBeGreaterThanOrEqual(0);
        expect(longitude).toBeLessThan(360);
      });
    });
  });

  describe('zodiac boundary conditions', () => {
    it('星座与度数必须与黄经一致，且行星分布在多个星座', () => {
      const planets = calculatePlanets(validBirthData);

      planets.forEach(planet => {
        expect(planet.sign.id).toBe(ZODIAC_SIGNS[Math.floor(planet.longitude / 30)].id);
        expect(planet.degree).toBeCloseTo(planet.longitude % 30, 6);
      });

      const signIds = new Set(planets.map(planet => planet.sign.id));
      expect(signIds.size).toBeGreaterThan(1);
    });
  });

  describe('edge cases', () => {
    it('should handle leap year date', () => {
      const leapYearData = { year: 2020, month: 2, day: 29, hour: 12, minute: 0, timezone: 'Asia/Shanghai' };
      const planets = calculatePlanets(leapYearData);
      expect(planets).toHaveLength(10);
      planets.forEach(p => {
        expect(p.longitude).toBeGreaterThanOrEqual(0);
        expect(p.longitude).toBeLessThan(360);
      });
    });

    it('should handle end of month', () => {
      const endOfMonthData = { year: 2020, month: 12, day: 31, hour: 23, minute: 59, timezone: 'Asia/Shanghai' };
      const planets = calculatePlanets(endOfMonthData);
      expect(planets).toHaveLength(10);
    });

    it('should handle beginning of year', () => {
      const newYearData = { year: 2000, month: 1, day: 1, hour: 0, minute: 0, timezone: 'Asia/Shanghai' };
      const planets = calculatePlanets(newYearData);
      expect(planets).toHaveLength(10);
    });

    it('should handle different century years', () => {
      const y1900 = { year: 1900, month: 6, day: 15, hour: 12, minute: 0, timezone: 'UTC' };
      const y2000 = { year: 2000, month: 6, day: 15, hour: 12, minute: 0, timezone: 'UTC' };
      const y2100 = { year: 2100, month: 6, day: 15, hour: 12, minute: 0, timezone: 'UTC' };

      const planets1900 = calculatePlanets(y1900);
      const planets2000 = calculatePlanets(y2000);
      const planets2100 = calculatePlanets(y2100);

      const sun1900 = planets1900.find(p => p.id === 'sun');
      const sun2000 = planets2000.find(p => p.id === 'sun');
      const sun2100 = planets2100.find(p => p.id === 'sun');

      expect(sun1900.longitude).not.toBe(sun2000.longitude);
      expect(sun2000.longitude).not.toBe(sun2100.longitude);
    });
  });

  // 回归用例：修复「时区被重复计入」和「上升点公式错误」时补的断言。
  // 之前的实现把目标时区偏移算了两遍，而且上升点几乎不随时间变化，老测试只断言
  // “有值、大于 0”，所以一直没暴露。
  describe('时间换算正确性（回归）', () => {
    const observer = { latitude: 31.2304, longitude: 121.4737 };
    // 同一时刻的三种写法：2000-08-16 14:30 CST = 06:30 UTC = 02:30 EDT
    const shanghai = { year: 2000, month: 8, day: 16, hour: 14, minute: 30, timezone: 'Asia/Shanghai', ...observer };
    const utc = { year: 2000, month: 8, day: 16, hour: 6, minute: 30, timezone: 'UTC', ...observer };
    const newYork = { year: 2000, month: 8, day: 16, hour: 2, minute: 30, timezone: 'America/New_York', ...observer };

    const sunLongitude = (data) =>
      calculatePlanets(data).find(p => p.id === 'sun').longitude;

    const referenceSunLongitude = (utcIso) =>
      Ecliptic(GeoVector(Body.Sun, new AstroTime(new Date(utcIso)), true)).elon;

    it('createAstroTime 应把出生地墙上时间换算成正确的 UTC 时刻', () => {
      expect(createAstroTime(shanghai).date.toISOString()).toBe('2000-08-16T06:30:00.000Z');
      expect(createAstroTime(utc).date.toISOString()).toBe('2000-08-16T06:30:00.000Z');
      expect(createAstroTime(newYork).date.toISOString()).toBe('2000-08-16T06:30:00.000Z');
    });

    it('同一时刻的不同时区写法必须得到相同的行星位置', () => {
      expect(sunLongitude(shanghai)).toBeCloseTo(sunLongitude(utc), 6);
      expect(sunLongitude(newYork)).toBeCloseTo(sunLongitude(utc), 6);
    });

    it('太阳黄经应与 astronomy-engine 参考值一致（误差 < 0.01°）', () => {
      expect(sunLongitude(shanghai)).toBeCloseTo(referenceSunLongitude('2000-08-16T06:30:00Z'), 2);
    });

    it('应正确处理历史夏令时（中国 1986-1991 年夏季为 UTC+9）', () => {
      const data = { year: 1990, month: 6, day: 15, hour: 14, minute: 30, timezone: 'Asia/Shanghai', ...observer };
      // 1990-06-15 中国在夏令时期间：14:30 本地 = 05:30 UTC（不是 06:30）
      expect(createAstroTime(data).date.toISOString()).toBe('1990-06-15T05:30:00.000Z');
      expect(sunLongitude(data)).toBeCloseTo(referenceSunLongitude('1990-06-15T05:30:00Z'), 2);
    });
  });

  describe('上升点与宫位（回归）', () => {
    const base = { year: 2000, month: 8, day: 16, hour: 14, minute: 30, timezone: 'Asia/Shanghai' };
    const observer = { latitude: 31.2304, longitude: 121.4737 };
    const DEG = Math.PI / 180;

    const ascendantAt = (hour, extra = {}) =>
      calculateAscendantMC({ ...base, hour, ...observer, ...extra }).ascendant.longitude;

    it('上升点应随出生时间显著转动（约 10-20°/小时）', () => {
      // 修复前 18 小时只转 0.74°，这里用 6 小时做界限即可判定回归
      const diff = ((ascendantAt(6) - ascendantAt(0)) + 360) % 360;
      expect(diff).toBeGreaterThan(60);
      expect(diff).toBeLessThan(120);
    });

    it('未填经纬度时使用默认观测点并标记 assumed', () => {
      const assumed = calculateAscendantMC(base);
      expect(assumed.observer.assumed).toBe(true);
      expect(assumed.observer.latitude).toBeCloseTo(DEFAULT_OBSERVER.latitude, 6);

      const explicit = calculateAscendantMC({ ...base, ...DEFAULT_OBSERVER });
      expect(explicit.observer.assumed).toBe(false);
      expect(explicit.ascendant.longitude).toBeCloseTo(assumed.ascendant.longitude, 6);
    });

    it('上升点应随出生地经纬度变化', () => {
      const shanghai = calculateAscendantMC({ ...base, ...observer }).ascendant.longitude;
      const beijing = calculateAscendantMC({ ...base, latitude: 39.9042, longitude: 116.4074 });
      expect(beijing.observer.latitude).toBeCloseTo(39.9042, 4);
      expect(Math.abs(beijing.ascendant.longitude - shanghai)).toBeGreaterThan(1);
    });

    it('上升点应落在东地平线上（球面条件自检，与闭式公式互为独立验证）', () => {
      const data = { ...base, ...observer };
      const time = createAstroTime(data);
      const localSiderealDegrees = (SiderealTime(time) * 15 + observer.longitude) % 360;
      const lambda = calculateAscendantMC(data).ascendant.longitude * DEG;
      const eps = OBLIQUITY_DEGREES * DEG;
      const phi = observer.latitude * DEG;

      const alpha = Math.atan2(Math.sin(lambda) * Math.cos(eps), Math.cos(lambda));
      const delta = Math.asin(Math.sin(lambda) * Math.sin(eps));
      const sinAltitude = Math.sin(phi) * Math.sin(delta) +
        Math.cos(phi) * Math.cos(delta) * Math.cos(localSiderealDegrees * DEG - alpha);

      expect(Math.abs(sinAltitude)).toBeLessThan(1e-3);

      const hourAngle = ((localSiderealDegrees * DEG - alpha + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      expect(hourAngle).toBeLessThan(0); // 负时角 = 东侧上升，而不是西沉
    });

    it('宫位是等宫制：第一宫等于上升点，每宫相差 30°', () => {
      const chart = calculateAstrologyChart({ ...base, ...observer });
      expect(chart.houseSystem).toBe(HOUSE_SYSTEM);
      expect(chart.houses).toHaveLength(12);
      expect(chart.houses[0].longitude).toBeCloseTo(chart.ascendant.longitude, 6);
      chart.houses.forEach((house, index) => {
        expect(house.longitude).toBeCloseTo((chart.ascendant.longitude + index * 30) % 360, 6);
      });
    });

    it('calculateHouses 接受裸黄经', () => {
      const houses = calculateHouses(123.45);
      expect(houses).toHaveLength(12);
      expect(houses[0].longitude).toBeCloseTo(123.45, 6);
      expect(() => calculateHouses(undefined)).toThrow(/上升点/);
    });
  });

  describe('输入校验（回归）', () => {
    it('不存在的日期应报错，而不是被 Date 静默进位', () => {
      expect(() => calculatePlanets({ year: 2021, month: 2, day: 30, hour: 12, minute: 0 }))
        .toThrow(/不存在/);
    });

    it('越界的时间应报错', () => {
      expect(() => calculatePlanets({ year: 2000, month: 1, day: 1, hour: 25, minute: 0 }))
        .toThrow(/小时/);
      expect(() => calculatePlanets({ year: 2000, month: 1, day: 1, hour: 1, minute: 61 }))
        .toThrow(/分钟/);
    });

    it('缺字段与非法时区应报错', () => {
      expect(() => calculatePlanets({ year: 2000, month: 1 })).toThrow(/不完整/);
      expect(() => calculatePlanets({ year: 2000, month: 1, day: 1, hour: 1, minute: 1, timezone: 'Not/AZone' }))
        .toThrow(/时区/);
    });

    it('越界的经纬度应报错', () => {
      const data = { year: 2000, month: 1, day: 1, hour: 1, minute: 1, timezone: 'UTC' };
      expect(() => calculateAscendantMC({ ...data, latitude: 999 })).toThrow(/纬度/);
      expect(() => calculateAscendantMC({ ...data, longitude: 999 })).toThrow(/经度/);
    });
  });
});
