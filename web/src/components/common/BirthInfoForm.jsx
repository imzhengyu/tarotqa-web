import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './BirthInfoForm.css';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE = { min: 1900, max: CURRENT_YEAR };

const TIMEZONES = [
  { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
  { value: 'Asia/Hong_Kong', label: '香港时间 (UTC+8)' },
  { value: 'Asia/Taipei', label: '台北时间 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '日本时间 (UTC+9)' },
  { value: 'Asia/Seoul', label: '韩国时间 (UTC+9)' },
  { value: 'Asia/Singapore', label: '新加坡时间 (UTC+8)' },
  { value: 'America/New_York', label: '纽约时间 (UTC-5)' },
  { value: 'America/Los_Angeles', label: '洛杉矶时间 (UTC-8)' },
  { value: 'America/Chicago', label: '芝加哥时间 (UTC-6)' },
  { value: 'Europe/London', label: '伦敦时间 (UTC+0)' },
  { value: 'Europe/Paris', label: '巴黎时间 (UTC+1)' },
  { value: 'Europe/Berlin', label: '柏林时间 (UTC+1)' },
  { value: 'Australia/Sydney', label: '悉尼时间 (UTC+10)' },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`
}));

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const getDefaultTimezone = () => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const found = TIMEZONES.find(tz => tz.value === userTimezone);
  return found ? userTimezone : 'Asia/Shanghai';
};

function BirthInfoForm({ value, onChange, showGender = false }) {
  const [localValue, setLocalValue] = useState(value || {
    year: 2000,
    month: 1,
    day: 1,
    hour: 12,
    minute: 0,
    timezone: getDefaultTimezone(),
    gender: 'male'
  });

  const [daysInCurrentMonth, setDaysInCurrentMonth] = useState(31);

  useEffect(() => {
    setDaysInCurrentMonth(getDaysInMonth(localValue.year, localValue.month));
  }, [localValue.year, localValue.month]);

  useEffect(() => {
    if (value) {
      setLocalValue(value);
      setDaysInCurrentMonth(getDaysInMonth(value.year, value.month));
    }
  }, [value]);

  const handleChange = (field, fieldValue) => {
    const newValue = { ...localValue, [field]: fieldValue };

    if (field === 'year' || field === 'month') {
      const days = getDaysInMonth(
        field === 'year' ? fieldValue : newValue.year,
        field === 'month' ? fieldValue : newValue.month
      );
      setDaysInCurrentMonth(days);
      if (newValue.day > days) {
        newValue.day = days;
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

  return (
    <div className="birth-info-form">
      <div className="form-row">
        <div className="form-group year-group">
          <label htmlFor="birth-year">出生年份</label>
          <select
            id="birth-year"
            value={localValue.year}
            onChange={(e) => handleChange('year', parseInt(e.target.value, 10))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        </div>

        <div className="form-group month-group">
          <label htmlFor="birth-month">月份</label>
          <select
            id="birth-month"
            value={localValue.month}
            onChange={(e) => handleChange('month', parseInt(e.target.value, 10))}
          >
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group day-group">
          <label htmlFor="birth-day">日期</label>
          <select
            id="birth-day"
            value={localValue.day}
            onChange={(e) => handleChange('day', parseInt(e.target.value, 10))}
          >
            {days.map(d => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group hour-group">
          <label htmlFor="birth-hour">小时</label>
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
          <label htmlFor="birth-minute">分钟</label>
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
          <label htmlFor="birth-timezone">时区</label>
          <select
            id="birth-timezone"
            value={localValue.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
          >
            {TIMEZONES.map(tz => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showGender && (
        <div className="form-row">
          <div className="form-group gender-group">
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend>性别</legend>
              <div className="gender-buttons">
                <button
                  type="button"
                  id="gender-male"
                  className={`gender-btn ${localValue.gender === 'male' ? 'active' : ''}`}
                  onClick={() => handleChange('gender', 'male')}
                >
                  男
                </button>
                <button
                  type="button"
                  id="gender-female"
                  className={`gender-btn ${localValue.gender === 'female' ? 'active' : ''}`}
                  onClick={() => handleChange('gender', 'female')}
                >
                  女
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
