/** 构建信息（sha / 提交时间）→ footer 展示文本。
 *
 * 提交时间由构建时注入（`__GIT_TIME__`，ISO8601），这里统一换算成北京时间（UTC+8）。
 * 用 Intl 指定 timeZone 而不是手动 +8h，避免夏令时/时区数据库差异带来的偏差。
 */

const BEIJING_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
});

/** ISO8601 → 'YYYY-MM-DD HH:mm'（北京时间）；无法解析时返回空串。 */
export function formatBeijingTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const parts = BEIJING_FORMATTER.formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value ?? '';
  const month = value('month');
  const day = value('day');
  if (!month || !day) return '';
  return `${value('year')}-${month}-${day} ${value('hour')}:${value('minute')}`;
}

/** footer 用的短 sha。 */
export function shortSha(sha, length = 8) {
  if (!sha || sha === 'local') return 'local';
  return sha.slice(0, length);
}

/** footer 里「sha 右边」的提交时间后缀，中英文各一份；无有效时间时返回空串。 */
export function commitTimeSuffix(iso, language = 'zh') {
  const time = formatBeijingTime(iso);
  if (!time) return '';
  return language === 'en' ? ` · ${time} (Beijing time)` : ` · ${time}（北京时间）`;
}
