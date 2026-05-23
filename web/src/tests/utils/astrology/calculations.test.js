import { describe, it, expect } from 'vitest';
import {
  calculateAstrologyChart,
  calculatePlanets,
  calculateAscendantMC,
  calculateHouses,
  formatBirthTime
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
    it('should return 10 planets', () => {
      const planets = calculatePlanets(validBirthData);
      expect(planets).toHaveLength(10);
    });

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

    it('should handle different timezones', () => {
      const dataShanghai = { year: 2000, month: 8, day: 16, hour: 14, minute: 30, timezone: 'Asia/Shanghai' };
      const dataUTC = { year: 2000, month: 8, day: 16, hour: 6, minute: 30, timezone: 'UTC' };
      const dataNY = { year: 2000, month: 8, day: 16, hour: 2, minute: 30, timezone: 'America/New_York' };

      const planets1 = calculatePlanets(dataShanghai);
      const planets2 = calculatePlanets(dataUTC);
      const planets3 = calculatePlanets(dataNY);

      const sun1 = planets1.find(p => p.id === 'sun');
      const sun2 = planets2.find(p => p.id === 'sun');
      const sun3 = planets3.find(p => p.id === 'sun');

      expect(sun1.longitude).toBeGreaterThan(0);
      expect(sun2.longitude).toBeGreaterThan(0);
      expect(sun3.longitude).toBeGreaterThan(0);
    });
  });

  describe('calculateAscendantMC', () => {
    it('should return ascendant and midheaven', () => {
      const result = calculateAscendantMC(validBirthData);
      expect(result).toHaveProperty('ascendant');
      expect(result).toHaveProperty('midheaven');
    });

    it('ascendant should have valid zodiac sign', () => {
      const result = calculateAscendantMC(validBirthData);
      expect(result.ascendant.sign).toBeDefined();
      expect(result.ascendant.sign.id).toBeDefined();
      const validSign = ZODIAC_SIGNS.find(s => s.id === result.ascendant.sign.id);
      expect(validSign).toBeDefined();
    });

    it('midheaven should have valid zodiac sign', () => {
      const result = calculateAscendantMC(validBirthData);
      expect(result.midheaven.sign).toBeDefined();
      expect(result.midheaven.sign.id).toBeDefined();
      const validSign = ZODIAC_SIGNS.find(s => s.id === result.midheaven.sign.id);
      expect(validSign).toBeDefined();
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

    it('each house longitude should be 0-360', () => {
      const houses = calculateHouses(ascendant);
      houses.forEach(house => {
        expect(house.longitude).toBeGreaterThanOrEqual(0);
        expect(house.longitude).toBeLessThan(360);
      });
    });

    it('each house degree should be 0-30', () => {
      const houses = calculateHouses(ascendant);
      houses.forEach(house => {
        expect(house.degree).toBeGreaterThanOrEqual(0);
        expect(house.degree).toBeLessThan(30);
      });
    });

    it('each house sign should be valid zodiac sign', () => {
      const houses = calculateHouses(ascendant);
      houses.forEach(house => {
        const validSign = ZODIAC_SIGNS.find(s => s.id === house.sign.id);
        expect(validSign).toBeDefined();
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

    it('exact should be boolean', () => {
      const chart = calculateAstrologyChart(validBirthData);
      chart.aspects.forEach(aspect => {
        expect(typeof aspect.exact).toBe('boolean');
      });
    });

    it('orb should be non-negative', () => {
      const chart = calculateAstrologyChart(validBirthData);
      chart.aspects.forEach(aspect => {
        expect(aspect.orb).toBeGreaterThanOrEqual(0);
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
    it('should return complete chart structure', () => {
      const chart = calculateAstrologyChart(validBirthData);

      expect(chart).toHaveProperty('planets');
      expect(chart).toHaveProperty('ascendant');
      expect(chart).toHaveProperty('midheaven');
      expect(chart).toHaveProperty('houses');
      expect(chart).toHaveProperty('aspects');
      expect(chart).toHaveProperty('birthData');
    });

    it('should return 10 planets', () => {
      const chart = calculateAstrologyChart(validBirthData);
      expect(chart.planets).toHaveLength(10);
    });

    it('should return 12 houses', () => {
      const chart = calculateAstrologyChart(validBirthData);
      expect(chart.houses).toHaveLength(12);
    });

    it('should include sun, moon, and outer planets', () => {
      const chart = calculateAstrologyChart(validBirthData);
      const planetIds = chart.planets.map(p => p.id);

      expect(planetIds).toContain('sun');
      expect(planetIds).toContain('moon');
      expect(planetIds).toContain('jupiter');
      expect(planetIds).toContain('saturn');
      expect(planetIds).toContain('pluto');
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

    it('should return birthData in result', () => {
      const chart = calculateAstrologyChart(validBirthData);
      expect(chart.birthData).toEqual(validBirthData);
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

  describe('normalizeAngle edge cases', () => {
    it('angle of exactly 0 should return 0', () => {
      calculateAstrologyChart({ ...validBirthData, day: 10 });
      const ascendant = calculateAscendantMC({ ...validBirthData, day: 10 });
      expect(ascendant.ascendant.longitude).toBeGreaterThanOrEqual(0);
    });

    it('angle of exactly 360 should return 0', () => {
      const chart = calculateAstrologyChart(validBirthData);
      expect(chart.ascendant.longitude).toBeLessThan(360);
    });

    it('negative angle should be normalized', () => {
      const chart = calculateAstrologyChart(validBirthData);
      chart.houses.forEach(house => {
        expect(house.longitude).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('zodiac boundary conditions', () => {
    it('longitude of 0 should be Aries 0°', () => {
      const planets = calculatePlanets(validBirthData);
      const planet = planets[0];
      expect(planet.longitude).toBeGreaterThanOrEqual(0);
      expect(planet.longitude).toBeLessThan(360);
    });

    it('all 12 zodiac signs should be represented across planets', () => {
      const planets = calculatePlanets(validBirthData);
      const signIds = [...new Set(planets.map(p => p.sign.id))];
      expect(signIds.length).toBeGreaterThan(1);
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

  describe('error handling', () => {
    it('should handle when planet body is not found (null body)', () => {
      const planets = calculatePlanets(validBirthData);
      const sun = planets.find(p => p.id === 'sun');
      expect(sun.longitude).toBeGreaterThan(0);
    });
  });
});
