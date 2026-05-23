import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLanguage } from '../../context/LanguageContext';
import './BirthInfoForm.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE = { min: 1900, max: CURRENT_YEAR };

const TIMEZONES = [
  { value: 'Asia/Shanghai', label_zh: '中国标准时间 (UTC+8)', label_en: 'China Standard Time (UTC+8)' },
  { value: 'Asia/Hong_Kong', label_zh: '香港时间 (UTC+8)', label_en: 'Hong Kong Time (UTC+8)' },
  { value: 'Asia/Taipei', label_zh: '台北时间 (UTC+8)', label_en: 'Taipei Time (UTC+8)' },
  { value: 'Asia/Tokyo', label_zh: '日本时间 (UTC+9)', label_en: 'Japan Time (UTC+9)' },
  { value: 'Asia/Seoul', label_zh: '韩国时间 (UTC+9)', label_en: 'Korea Time (UTC+9)' },
  { value: 'Asia/Singapore', label_zh: '新加坡时间 (UTC+8)', label_en: 'Singapore Time (UTC+8)' },
  { value: 'America/New_York', label_zh: '纽约时间 (UTC-5)', label_en: 'New York Time (UTC-5)' },
  { value: 'America/Los_Angeles', label_zh: '洛杉矶时间 (UTC-8)', label_en: 'Los Angeles Time (UTC-8)' },
  { value: 'America/Chicago', label_zh: '芝加哥时间 (UTC-6)', label_en: 'Chicago Time (UTC-6)' },
  { value: 'Europe/London', label_zh: '伦敦时间 (UTC+0)', label_en: 'London Time (UTC+0)' },
  { value: 'Europe/Paris', label_zh: '巴黎时间 (UTC+1)', label_en: 'Paris Time (UTC+1)' },
  { value: 'Europe/Berlin', label_zh: '柏林时间 (UTC+1)', label_en: 'Berlin Time (UTC+1)' },
  { value: 'Australia/Sydney', label_zh: '悉尼时间 (UTC+10)', label_en: 'Sydney Time (UTC+10)' },
];

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const getDefaultTimezone = () => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const found = TIMEZONES.find(tz => tz.value === userTimezone);
  return found ? userTimezone : 'Asia/Shanghai';
};

function BirthInfoForm({ value, onChange, showGender = false }) {
  const { language } = useLanguage();
  const [localValue, setLocalValue] = useState(value || {
    year: 2000,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    timezone: getDefaultTimezone(),
    gender: 'male'
  });

  const daysInCurrentMonth = getDaysInMonth(localValue.year, localValue.month);

  useEffect(() => {
    if (value) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (field, fieldValue) => {
    const newValue = { ...localValue, [field]: fieldValue };

    if (field === 'year' || field === 'month') {
      const newDays = getDaysInMonth(
        field === 'year' ? fieldValue : newValue.year,
        field === 'month' ? fieldValue : newValue.month
      );
      if (newValue.day > newDays) {
        newValue.day = newDays;
      }
    }

    setLocalValue(newValue);
    onChange?.(newValue);
  };

  const years = Array.from(
    { length: YEAR_RANGE.max - YEAR_RANGE.min + 1 },
    (_, i) => YEAR_RANGE.max - i
  );

  const days = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const isZh = language === 'zh';

  return (
    <div className="birth-info-form">
      <div className="form-row">
        <div className="form-group year-group">
          <label htmlFor="birth-year">{isZh ? '出生年份' : 'Birth Year'}</label>
          <select
            id="birth-year"
            value={localValue.year}
            onChange={(e) => handleChange('year', parseInt(e.target.value, 10))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}{isZh ? '年' : ''}</option>
            ))}
          </select>
        </div>

        <div className="form-group month-group">
          <label htmlFor="birth-month">{isZh ? '月份' : 'Month'}</label>
          <select
            id="birth-month"
            value={localValue.month}
            onChange={(e) => handleChange('month', parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m}{isZh ? '月' : ''}</option>
            ))}
          </select>
        </div>

        <div className="form-group day-group">
          <label htmlFor="birth-day">{isZh ? '日期' : 'Day'}</label>
          <select
            id="birth-day"
            value={localValue.day}
            onChange={(e) => handleChange('day', parseInt(e.target.value, 10))}
          >
            {days.map(d => (
              <option key={d} value={d}>{d}{isZh ? '日' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group hour-group">
          <label htmlFor="birth-hour">{isZh ? '小时' : 'Hour'}</label>
          <select
            id="birth-hour"
            value={localValue.hour}
            onChange={(e) => handleChange('hour', parseInt(e.target.value, 10))}
          >
            {hours.map(h => (
              <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
            ))}
          </select>
        </div>

        <div className="form-group minute-group">
          <label htmlFor="birth-minute">{isZh ? '分钟' : 'Minute'}</label>
          <select
            id="birth-minute"
            value={localValue.minute}
            onChange={(e) => handleChange('minute', parseInt(e.target.value, 10))}
          >
            {minutes.filter(m => m % 5 === 0).map(m => (
              <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group timezone-group">
          <label htmlFor="birth-timezone">{isZh ? '时区' : 'Timezone'}</label>
          <select
            id="birth-timezone"
            value={localValue.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{isZh ? tz.label_zh : tz.label_en}</option>
            ))}
          </select>
        </div>
      </div>

      {showGender && (
        <div className="form-row">
          <div className="form-group gender-group">
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend>{isZh ? '性别' : 'Gender'}</legend>
              <div className="gender-buttons">
                <button
                  type="button"
                  id="gender-male"
                  className={`gender-btn ${localValue.gender === 'male' ? 'active' : ''}`}
                  onClick={() => handleChange('gender', 'male')}
                >
                  {isZh ? '男' : 'Male'}
                </button>
                <button
                  type="button"
                  id="gender-female"
                  className={`gender-btn ${localValue.gender === 'female' ? 'active' : ''}`}
                  onClick={() => handleChange('gender', 'female')}
                >
                  {isZh ? '女' : 'Female'}
                </button>
              </div>
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}

BirthInfoForm.propTypes = {
  value: PropTypes.shape({
    year: PropTypes.number,
    month: PropTypes.number,
    day: PropTypes.number,
    hour: PropTypes.number,
    minute: PropTypes.number,
    timezone: PropTypes.string,
    gender: PropTypes.oneOf(['male', 'female'])
  }),
  onChange: PropTypes.func.isRequired,
  showGender: PropTypes.bool
};

export default BirthInfoForm;
