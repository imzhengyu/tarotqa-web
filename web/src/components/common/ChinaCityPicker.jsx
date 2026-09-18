import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useLanguage } from '../../context/LanguageContext';
import Icon from './Icons';
import './ChinaCityPicker.css';

/**
 * 中国省市两级出生地选择弹窗（数据来自 /china-geo.json，GeoNames CC BY 4.0）。
 * 只做两级：省/直辖市 → 地级市，足够星盘计算上升点的精度。
 */
let geoPromise;
const loadChinaGeo = () => {
  if (!geoPromise) {
    geoPromise = fetch(`${import.meta.env.BASE_URL}china-geo.json`).then((response) => {
      if (!response.ok) throw new Error('china-geo load failed');
      return response.json();
    });
  }
  return geoPromise;
};

function ChinaCityPicker({ isOpen, value, onSelect, onClose }) {
  const { t } = useLanguage();
  const [geo, setGeo] = useState(null);
  const [error, setError] = useState(null);
  const [province, setProvince] = useState(null);

  useEffect(() => {
    if (!isOpen || geo) return undefined;
    let alive = true;
    loadChinaGeo()
      .then((data) => { if (alive) setGeo(data); })
      .catch((loadError) => { if (alive) setError(loadError.message); });
    return () => { alive = false; };
  }, [isOpen, geo]);

  // 打开时定位到已选省份
  useEffect(() => {
    if (!isOpen || !geo) return;
    const target = value?.province
      ? geo.provinces.find((item) => item.name === value.province)
      : null;
    setProvince(target || null);
  }, [isOpen, geo, value]);

  if (!isOpen) return null;

  return (
    <div className="city-picker-overlay" role="presentation" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="city-picker" role="dialog" aria-modal="true" aria-label={t('选择出生地', 'Select birthplace')}>
        <div className="city-picker-head">
          <h3>{t('选择出生地', 'Select birthplace')}</h3>
          <button type="button" className="city-picker-close" onClick={onClose} aria-label={t('关闭', 'Close')}>
            <Icon name="close" size={18} />
          </button>
        </div>

        {error && <p className="city-picker-message">{t('出生地数据加载失败', 'Failed to load location data')}：{error}</p>}
        {!geo && !error && <p className="city-picker-message">{t('加载中…', 'Loading…')}</p>}

        {geo && (
          <div className="city-picker-body">
            <ul className="city-picker-provinces">
              {geo.provinces.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    className={`city-picker-option ${province?.name === item.name ? 'active' : ''}`}
                    onClick={() => setProvince(item)}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>

            <ul className="city-picker-cities">
              {!province && <li className="city-picker-hint">{t('请先选择省份', 'Select a province first')}</li>}
              {province?.cities.map((city) => (
                <li key={`${province.name}-${city.name}`}>
                  <button
                    type="button"
                    className={`city-picker-option ${value?.city === city.name && value?.province === province.name ? 'active' : ''}`}
                    onClick={() => {
                      onSelect({ province: province.name, city: city.name, lat: city.lat, lon: city.lon });
                      onClose();
                    }}
                  >
                    {city.name}
                    <span className="city-picker-coord">{city.lat.toFixed(2)}, {city.lon.toFixed(2)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="city-picker-attribution">
          {t('经纬度数据：', 'Coordinates: ')}
          <a href={geo?.sourceUrl || 'https://download.geonames.org/export/dump/'} target="_blank" rel="noopener noreferrer">GeoNames</a>
          {' '}(CC BY 4.0)
        </p>
      </div>
    </div>
  );
}

ChinaCityPicker.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  value: PropTypes.shape({
    province: PropTypes.string,
    city: PropTypes.string,
    lat: PropTypes.number,
    lon: PropTypes.number
  }),
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ChinaCityPicker;
