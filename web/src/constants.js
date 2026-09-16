// TarotQA constants
// 所有硬编码的配置值集中管理

export const AI_PROVIDERS = {
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    requestFormat: 'openai',
    temperature: 1,
    topP: 0.95,
    maxCompletionTokens: 8192
  }
};

export const DEFAULT_AI_PROVIDER = 'deepseek';

/** 用户在「我的」页自定义 Key 时写入 localStorage 的键名 */
export const API_KEY_STORAGE_KEY = 'deepseek_api_key';

/** 构建时注入默认 Key 的环境变量名（本地 .env.local 与 CI secret 都走它） */
export const DEFAULT_API_KEY_ENV = 'VITE_TAROT_DEEPSEEK_API_KEY';

export const UI_LIMITS = {
  MAX_QUESTION_LENGTH: 500,
  QUESTION_WARNING_THRESHOLD: 400
};

export const TIMING = {
  /**
   * AI 请求冷却秒数：全站统一 10 秒（塔罗 / 紫微 / 星盘共用同一个值和存储键）。
   * 可用 `VITE_AI_COOLDOWN_SECONDS` 覆盖，但不要在组件里另写死秒数。
   */
  AI_COOLDOWN_SECONDS: Number(import.meta.env.VITE_AI_COOLDOWN_SECONDS) > 0
    ? Number(import.meta.env.VITE_AI_COOLDOWN_SECONDS)
    : 10,
  /** 三个页面共用同一个冷却存储键，避免各页面各自倒计时 */
  AI_COOLDOWN_STORAGE_KEY: 'tarotqa_ai_cooldown_end',
  DEVICE_STATS_UPDATE_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
  DURATION_HOUR_MS: 3600000,
  DURATION_MINUTE_MS: 60000
};

export const INTERSECTION = {
  ROOT_MARGIN_PRELOAD: '50px',
  ROOT_MARGIN_DEFAULT: '100px'
};

// Responsive breakpoints
export const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1024
};

// Persona IDs for AI interpretation
export const PERSONA_IDS = {
  GENERAL: 'general',
  CAREER: 'career',
  LOVE: 'love',
  FINANCE: 'finance',
  DECISION: 'decision',
  FORTUNE: 'fortune'
};

// Astrology chart constants
export const ASTROLOGY_CHART = {
  CHART_SIZE: 500,
  CENTER: 250,
  OUTER_RADIUS: 230,
  INNER_RADIUS: 180,
  HOUSE_RADIUS: 150,
  PLANET_RADIUS: 120,
  ZODIAC_SEGMENT_DEGREES: 30,
  ZODIAC_OFFSET_DEGREES: 90,
  ZODIAC_MIDPOINT_OFFSET: 15
};
