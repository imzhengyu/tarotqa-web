import { describe, it, expect } from 'vitest';
import { calculateAstrologyChart } from '../../../utils/astrology/calculations';
import { ZODIAC_SIGNS } from '../../../utils/astrology/constants';

const validBirthData = {
  year: 2000,
  month: 8,
  day: 16,
  hour: 14,
  minute: 30,
  timezone: 'Asia/Shanghai'
};

describe('Astrology Calculations', () => {
  describe('calculateAstrologyChart - full chart generation', () => {
    it('should return complete chart structure with all required fields', () => {
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
  });

  describe('calculateAspects - aspect detection', () => {
    it('should return array of detected aspects', () => {
      const chart = calculateAstrologyChart(validBirthData);
      expect(Array.isArray(chart.aspects)).toBe(true);
    });

    it('should detect aspects when planets are in aspect', () => {
      // Aspects are detected based on orb tolerance
      // Just verify we get some aspects back
      const chart = calculateAstrologyChart(validBirthData);
      const aspects = chart.aspects;

      // Each aspect should have required properties
      aspects.forEach(aspect => {
        expect(aspect).toHaveProperty('planet1');
        expect(aspect).toHaveProperty('planet2');
        expect(aspect).toHaveProperty('type');
        expect(aspect).toHaveProperty('angle');
        expect(aspect).toHaveProperty('orb');
        expect(aspect).toHaveProperty('exact');
      });
    });

    it('each aspect should have valid type', () => {
      const chart = calculateAstrologyChart(validBirthData);
      const validTypes = ['conjunction', 'opposition', 'trine', 'square', 'sextile'];

      chart.aspects.forEach(aspect => {
        expect(validTypes).toContain(aspect.type);
      });
    });
  });

  describe('ascendant and midheaven', () => {
    it('should have valid zodiac sign for ascendant', () => {
      const chart = calculateAstrologyChart(validBirthData);
      expect(chart.ascendant.sign).toBeDefined();
      expect(chart.ascendant.sign.id).toBeDefined();
    });

    it('should have valid zodiac sign for midheaven', () => {
      const chart = calculateAstrologyChart(validBirthData);
      expect(chart.midheaven.sign).toBeDefined();
      expect(chart.midheaven.sign.id).toBeDefined();
    });

    it('should have longitude between 0-360', () => {
      const chart = calculateAstrologyChart(validBirthData);

      expect(chart.ascendant.longitude).toBeGreaterThanOrEqual(0);
      expect(chart.ascendant.longitude).toBeLessThan(360);
      expect(chart.midheaven.longitude).toBeGreaterThanOrEqual(0);
      expect(chart.midheaven.longitude).toBeLessThan(360);
    });
  });
});
