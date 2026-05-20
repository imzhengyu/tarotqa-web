import {
  AstroTime,
  Body,
  EclipticLongitude,
  Equator,
  Observer
} from 'astronomy-engine';
import { ZODIAC_SIGNS, PLANETS, HOUSES } from './constants';

const PLANET_MAP = {
  sun: Body.Sun,
  moon: Body.Moon,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto
};

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

/**
 * Get zodiac sign from longitude
 */
function getZodiacFromLongitude(longitude) {
  const signIndex = Math.floor(longitude / 30);
  const degreeInSign = longitude % 30;
  return {
    sign: ZODIAC_SIGNS[signIndex],
    degree: degreeInSign
  };
}

/**
 * Create AstroTime from birth data
 */
function createAstroTime(birthData) {
  const { year, month, day, hour, minute, timezone } = birthData;

  // Create date in local time
  const localDate = new Date(year, month - 1, day, hour, minute);

  // Convert to UTC
  const utcDate = new Date(localDate.toLocaleString('en-US', { timeZone: timezone }));

  return new AstroTime(utcDate);
}

/**
 * Calculate planetary positions for birth data
 */
export function calculatePlanets(birthData) {
  const time = createAstroTime(birthData);

  const planets = PLANETS.map(planet => {
    const body = PLANET_MAP[planet.id];
    if (!body) return null;

    try {
      // Get ecliptic longitude for the planet
      const longitude = EclipticLongitude(body, time);

      // Get zodiac sign info
      const { sign, degree } = getZodiacFromLongitude(longitude);

      // Get right ascension and declination for house calculation
      const eq = Equator(body, time, new Observer(0, 0, 0), true, true);

      return {
        ...planet,
        longitude: normalizeAngle(longitude),
        sign: sign,
        degree: degree,
        ra: eq.ra, // right ascension in hours
        dec: eq.dec // declination in degrees
      };
    } catch (error) {
      console.error(`Error calculating ${planet.name}:`, error);
      return {
        ...planet,
        longitude: 0,
        sign: ZODIAC_SIGNS[0],
        degree: 0,
        ra: 0,
        dec: 0
      };
    }
  });

  return planets.filter(Boolean);
}

/**
 * Calculate Ascendant and Midheaven using simplified formula
 * This is a simplified calculation - for accurate results, use Swiss Ephemeris or similar
 */
export function calculateAscendantMC(birthData) {
  const { day, hour, minute } = birthData;

  // Simplified Ascendant calculation
  // In reality, this requires more complex astronomical calculations

  // Approximate Ascendant based on local sidereal time
  // This is a simplified formula - accurate calculation requires iterative methods
  const localSiderealTime = (100.46 + 0.985647 * (day +
    (hour + minute / 60) / 24
  ) + longitude * 15) % 360;

  // Simplified formula for Ascendant
  // The ascendant is where the eastern horizon intersects the ecliptic
  const ascendant = normalizeAngle(localSiderealTime + 90);

  // Midheaven (MC) is where the meridian intersects the ecliptic
  const midheaven = normalizeAngle(localSiderealTime);

  return {
    ascendant: {
      longitude: ascendant,
      ...getZodiacFromLongitude(ascendant)
    },
    midheaven: {
      longitude: midheaven,
      ...getZodiacFromLongitude(midheaven)
    }
  };
}

/**
 * Calculate house positions using Placidus system (simplified)
 */
export function calculateHouses(birthData) {
  const { ascendant } = calculateAscendantMC(birthData);

  // Simplified house calculation
  // Each house is approximately 30 degrees, starting from Ascendant
  const houses = HOUSES.map((house, index) => {
    const houseStart = normalizeAngle(ascendant.longitude + (index * 30));
    const { sign, degree } = getZodiacFromLongitude(houseStart);

    return {
      ...house,
      longitude: houseStart,
      sign: sign,
      degree: degree
    };
  });

  return houses;
}

/**
 * Calculate aspects between planets
 */
export function calculateAspects(planets) {
  const aspects = [];
  const aspectAngles = {
    conjunction: 0,
    opposition: 180,
    trine: 120,
    square: 90,
    sextile: 60
  };

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const planet1 = planets[i];
      const planet2 = planets[j];

      if (!planet1 || !planet2) continue;

      const angleDiff = Math.abs(planet1.longitude - planet2.longitude);
      const normalizedDiff = Math.min(angleDiff, 360 - angleDiff);

      // Check each aspect type
      for (const [aspectName, aspectAngle] of Object.entries(aspectAngles)) {
        const orb = Math.abs(normalizedDiff - aspectAngle);
        const maxOrb = aspectName === 'conjunction' || aspectName === 'opposition' ? 10 :
                       aspectName === 'trine' || aspectName === 'square' ? 8 : 6;

        if (orb <= maxOrb) {
          aspects.push({
            planet1: planet1.id,
            planet2: planet2.id,
            type: aspectName,
            angle: normalizedDiff,
            orb: orb,
            exact: orb <= 2
          });
        }
      }
    }
  }

  return aspects;
}

/**
 * Main function to calculate full astrology chart
 */
export function calculateAstrologyChart(birthData) {
  const planets = calculatePlanets(birthData);
  const { ascendant, midheaven } = calculateAscendantMC(birthData);
  const houses = calculateHouses(birthData);
  const aspects = calculateAspects(planets);

  return {
    planets,
    ascendant,
    midheaven,
    houses,
    aspects,
    birthData
  };
}

/**
 * Get formatted birth time string
 */
export function formatBirthTime(birthData) {
  const { hour, minute } = birthData;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// Longitude for timezone calculation helper
const longitude = 120; // Default to China timezone approximation
