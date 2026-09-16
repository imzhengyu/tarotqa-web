import {
  AstroTime,
  Body,
  EclipticLongitude,
  Ecliptic,
  GeoVector,
  Equator,
  Observer,
  SiderealTime
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

const MINUTE_MS = 60000;
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/** 黄赤交角（度）。用约定值即可满足本项目的精度要求。 */
export const OBLIQUITY_DEGREES = 23.4392911;

/** 宫位制：本项目实现的是等宫制（Equal House），不是 Placidus。 */
export const HOUSE_SYSTEM = 'equal';

/**
 * 表单没有出生地时的兜底观测点（上海）。
 * 只要用户填了经纬度就一定优先使用用户输入，见 resolveObserver。
 */
export const DEFAULT_OBSERVER = { latitude: 31.2304, longitude: 121.4737 };

export const DEFAULT_TIMEZONE = 'Asia/Shanghai';

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

function assertValidBirthDate(year, month, day, hour, minute) {
  const values = { year, month, day, hour, minute };
  for (const [name, value] of Object.entries(values)) {
    if (!Number.isFinite(Number(value))) {
      throw new Error(`出生信息不完整：${name} 不是有效数字`);
    }
  }

  const normalized = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const isRealDate =
    normalized.getUTCFullYear() === Number(year) &&
    normalized.getUTCMonth() === Number(month) - 1 &&
    normalized.getUTCDate() === Number(day);

  if (!isRealDate) {
    throw new Error(`出生日期不存在：${year}-${month}-${day}`);
  }
  if (Number(hour) < 0 || Number(hour) > 23) {
    throw new Error(`出生小时必须在 0-23 之间：${hour}`);
  }
  if (Number(minute) < 0 || Number(minute) > 59) {
    throw new Error(`出生分钟必须在 0-59 之间：${minute}`);
  }
}

/**
 * 某个时刻在指定 IANA 时区的偏移（分钟，东为正）。
 */
function getTimeZoneOffsetMinutes(date, timeZone) {
  let formatter;
  try {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    throw new Error(`无效的时区：${timeZone}`, { cause: error });
  }

  const parts = formatter.formatToParts(date);
  const get = (type) => parseInt(parts.find((part) => part.type === type)?.value ?? '0', 10);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second')
  );
  return (asUtc - date.getTime()) / MINUTE_MS;
}

/**
 * 把「出生地墙上时间」换算成真实 UTC 时刻。
 *
 * 关键点：结果只能由 birthData 决定，不能受运行机器时区影响，因此
 * 先用出生时间本身求一次目标时区偏移，再用接近真实时刻的偏移迭代一次
 * （第二次是为了跨夏令时切换时取到正确的偏移）。
 */
export function createAstroTime(birthData) {
  const { year, month, day, hour, minute } = birthData || {};
  const timeZone = birthData?.timezone || DEFAULT_TIMEZONE;

  assertValidBirthDate(year, month, day, hour, minute);

  const wallClockAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0, 0);

  let offsetMinutes = getTimeZoneOffsetMinutes(new Date(wallClockAsUtc), timeZone);
  let instant = wallClockAsUtc - offsetMinutes * MINUTE_MS;
  offsetMinutes = getTimeZoneOffsetMinutes(new Date(instant), timeZone);
  instant = wallClockAsUtc - offsetMinutes * MINUTE_MS;

  return new AstroTime(new Date(instant));
}

/**
 * 出生地观测点：优先用调用方传入的经纬度，否则退回默认观测点并标记 assumed。
 */
function resolveObserver(birthData) {
  const hasLatitude = birthData?.latitude !== undefined && birthData?.latitude !== null && birthData?.latitude !== '';
  const hasLongitude = birthData?.longitude !== undefined && birthData?.longitude !== null && birthData?.longitude !== '';

  const latitude = hasLatitude ? Number(birthData.latitude) : DEFAULT_OBSERVER.latitude;
  const longitude = hasLongitude ? Number(birthData.longitude) : DEFAULT_OBSERVER.longitude;

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error(`出生地纬度必须在 -90 到 90 之间：${birthData?.latitude}`);
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error(`出生地经度必须在 -180 到 180 之间：${birthData?.longitude}`);
  }

  return { latitude, longitude, assumed: !hasLatitude || !hasLongitude };
}

/**
 * Calculate planetary positions for birth data
 */
export function calculatePlanets(birthData) {
  const time = createAstroTime(birthData);
  const observer = new Observer(0, 0, 0);
  const failures = [];

  const planets = PLANETS.map((planet) => {
    const body = PLANET_MAP[planet.id];
    if (!body) return null;

    try {
      // Sun uses GeoVector + Ecliptic (EclipticLongitude throws for Sun)
      const longitude = planet.id === 'sun'
        ? Ecliptic(GeoVector(Body.Sun, time, true)).elon
        : EclipticLongitude(body, time);

      const { sign, degree } = getZodiacFromLongitude(longitude);
      const eq = Equator(body, time, observer, true, true);

      return {
        ...planet,
        longitude: normalizeAngle(longitude),
        sign,
        degree,
        ra: eq.ra, // right ascension in hours
        dec: eq.dec // declination in degrees
      };
    } catch (error) {
      failures.push(`${planet.name}(${error.message})`);
      return null;
    }
  }).filter(Boolean);

  if (failures.length > 0) {
    // 不再用 0° 顶替：宁可让上层显示错误，也不要把假数据喂给 AI 解读
    throw new Error(`行星位置计算失败：${failures.join('、')}`);
  }

  return planets;
}

/**
 * Calculate Ascendant and Midheaven.
 *
 * 公式（标准球面三角，RAMC = 本地恒星时）：
 *   ASC = atan2( cos(RAMC), -( sin(RAMC)·cos ε + tan φ·sin ε ) )
 *   MC  = atan2( sin(RAMC),     cos(RAMC)·cos ε )
 * 其中 ε 为黄赤交角、φ 为出生地纬度，经度只通过本地恒星时进入计算。
 */
export function calculateAscendantMC(birthData) {
  const time = createAstroTime(birthData);
  const observer = resolveObserver(birthData);

  const gastHours = SiderealTime(time); // 格林尼治视恒星时（小时）
  const localSiderealDegrees = normalizeAngle(gastHours * 15 + observer.longitude);

  const ramc = localSiderealDegrees * DEG_TO_RAD;
  const obliquity = OBLIQUITY_DEGREES * DEG_TO_RAD;
  const latitude = observer.latitude * DEG_TO_RAD;

  const ascendant = normalizeAngle(
    Math.atan2(
      Math.cos(ramc),
      -(Math.sin(ramc) * Math.cos(obliquity) + Math.tan(latitude) * Math.sin(obliquity))
    ) * RAD_TO_DEG
  );

  const midheaven = normalizeAngle(
    Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(obliquity)) * RAD_TO_DEG
  );

  return {
    ascendant: {
      longitude: ascendant,
      ...getZodiacFromLongitude(ascendant)
    },
    midheaven: {
      longitude: midheaven,
      ...getZodiacFromLongitude(midheaven)
    },
    observer: {
      latitude: observer.latitude,
      longitude: observer.longitude,
      assumed: observer.assumed
    }
  };
}

/**
 * Calculate house cusps using the Equal House system:
 * 每宫 30°，从上升点起算。不是 Placidus。
 * @param {number|{longitude: number}} ascendant
 */
export function calculateHouses(ascendant) {
  const ascendantLongitude = normalizeAngle(
    typeof ascendant === 'number' ? ascendant : ascendant?.longitude
  );

  if (!Number.isFinite(ascendantLongitude)) {
    throw new Error('calculateHouses 需要有效的上升点黄经');
  }

  return HOUSES.map((house, index) => {
    const houseStart = normalizeAngle(ascendantLongitude + (index * 30));
    const { sign, degree } = getZodiacFromLongitude(houseStart);

    return {
      ...house,
      longitude: houseStart,
      sign,
      degree
    };
  });
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
  const { ascendant, midheaven, observer } = calculateAscendantMC(birthData);
  const houses = calculateHouses(ascendant);
  const aspects = calculateAspects(planets);

  return {
    planets,
    ascendant,
    midheaven,
    houses,
    aspects,
    birthData,
    observer,
    houseSystem: HOUSE_SYSTEM
  };
}

/**
 * Get formatted birth time string
 */
export function formatBirthTime(birthData) {
  const { hour, minute } = birthData;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
