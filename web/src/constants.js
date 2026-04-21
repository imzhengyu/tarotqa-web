// TarotQA constants
// 所有硬编码的配置值集中管理

export const AI_CONFIG = {
  MODEL: 'MiniMax-M2.7-highspeed',
  API_URL: 'https://api.minimaxi.com/v1/text/chatcompletion_v2',
  TEMPERATURE: 1,
  TOP_P: 0.95,
  MAX_COMPLETION_TOKENS: 1024
};

export const UI_LIMITS = {
  MAX_QUESTION_LENGTH: 500,
  QUESTION_WARNING_THRESHOLD: 400,
  MAX_PHONE_LENGTH: 11,
  MAX_VERIFICATION_CODE_LENGTH: 6
};

export const TIMING = {
  AI_COOLDOWN_SECONDS: 60,
  DEVICE_STATS_UPDATE_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
  DURATION_HOUR_MS: 3600000,
  DURATION_MINUTE_MS: 60000
};

export const INTERSECTION = {
  ROOT_MARGIN_PRELOAD: '300px',
  ROOT_MARGIN_DEFAULT: '200px'
};

// Responsive breakpoints
export const BREAKPOINTS = {
  TABLET: 768,
  DESKTOP: 1024
};
