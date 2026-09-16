import PropTypes from 'prop-types';

/**
 * 统一的线性图标集（1.5px 描边，跟随 currentColor）。
 * 视觉风格 B 把所有 emoji 图标换成了这里的 SVG，避免不同平台 emoji 字体不一致。
 */
const PATHS = {
  home: '<path d="M3 10.5 12 3.5l9 7"/><path d="M5.5 9.8V20h13V9.8"/>',
  tarot: '<rect x="3.5" y="4" width="10" height="16" rx="1.5"/><path d="M17 7.5h3.5V20H17"/><path d="M8.5 9.5v5M6 12h5"/>',
  cards: '<rect x="4" y="3.5" width="12" height="17" rx="2"/><path d="M9 8.5 10.5 6 12 8.5 10.5 11z"/>',
  ziwei: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M12 3.5v17M3.5 12h17"/>',
  astro: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  download: '<path d="M12 4v10m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/>',
  up: '<path d="M12 19V6m0 0-6 6m6-6 6 6"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 8.2v.3"/>',
  alert: '<path d="M12 4.5 21 19.5H3z"/><path d="M12 10v4M12 16.6v.3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M4 16l4.5-4.5L13 16l2.5-2.5L20 17"/><circle cx="9" cy="9.5" r="1.2"/>',
  book: '<path d="M4 5.5A2 2 0 0 1 6 3.5h12v17H6a2 2 0 0 1-2-2z"/><path d="M8 3.5v17"/>',
  sparkle: '<path d="M12 4l1.8 4.7L18.5 10.5l-4.7 1.8L12 17l-1.8-4.7L5.5 10.5l4.7-1.8z"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
  desktop: '<rect x="3" y="4.5" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16.5V20"/>',
  tablet: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M11 18h2"/>',
  mobile: '<rect x="7.5" y="2.5" width="9" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4h-4"/>',
  question: '<circle cx="12" cy="12" r="8.5"/><path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.8c0 1.6-2.2 2-2.2 3.4"/><path d="M12 17v.3"/>'
};

function Icon({ name, size = 20, className = '', ...rest }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: path }}
      {...rest}
    />
  );
}

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(PATHS)).isRequired,
  size: PropTypes.number,
  className: PropTypes.string
};

export default Icon;
export { PATHS as ICON_PATHS };
