import { useState, useEffect } from 'react';
import api from '../services/api';
import './Horoscope.css';

const zodiacList = [
  { id: 'aries', name: '白羊座', symbol: '♈', element: '火' },
  { id: 'taurus', name: '金牛座', symbol: '♉', element: '土' },
  { id: 'gemini', name: '双子座', symbol: '♊', element: '风' },
  { id: 'cancer', name: '巨蟹座', symbol: '♋', element: '水' },
  { id: 'leo', name: '狮子座', symbol: '♌', element: '火' },
  { id: 'virgo', name: '处女座', symbol: '♍', element: '土' },
  { id: 'libra', name: '天秤座', symbol: '♎', element: '风' },
  { id: 'scorpio', name: '天蝎座', symbol: '♏', element: '水' },
  { id: 'sagittarius', name: '射手座', symbol: '♐', element: '火' },
  { id: 'capricorn', name: '摩羯座', symbol: '♑', element: '土' },
  { id: 'aquarius', name: '水瓶座', symbol: '♒', element: '风' },
  { id: 'pisces', name: '双鱼座', symbol: '♓', element: '水' },
];

function Horoscope() {
  const [selected, setSelected] = useState('aries');
  const [horoscope, setHoroscope] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHoroscope(selected);
  }, [selected]);

  const loadHoroscope = async (zodiac) => {
    setLoading(true);
    try {
      const data = await api.getHoroscope(zodiac);
      setHoroscope(data);
    } catch (error) {
      console.error('Failed to load horoscope:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="horoscope">
      <h1 className="page-title">每日运势</h1>

      <div className="zodiac-selector">
        {zodiacList.map(z => (
          <button
            key={z.id}
            className={`zodiac-btn ${selected === z.id ? 'active' : ''}`}
            onClick={() => setSelected(z.id)}
          >
            <span className="zodiac-symbol">{z.symbol}</span>
            <span className="zodiac-name">{z.name}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : horoscope ? (
        <div className="horoscope-content">
          <div className="horoscope-header">
            <h2>{horoscope.zodiacName} {horoscope.date}</h2>
          </div>

          <div className="horoscope-grid">
            <div className="horoscope-card overall">
              <h3>综合运势</h3>
              <p>{horoscope.overall}</p>
            </div>
            <div className="horoscope-card love">
              <h3>爱情运势</h3>
              <p>{horoscope.love}</p>
            </div>
            <div className="horoscope-card career">
              <h3>事业运势</h3>
              <p>{horoscope.career}</p>
            </div>
            <div className="horoscope-card finance">
              <h3>财运</h3>
              <p>{horoscope.finance}</p>
            </div>
          </div>

          <div className="lucky-info">
            <div className="lucky-item">
              <span className="lucky-label">幸运数字</span>
              <span className="lucky-value">{horoscope.luckyNumber}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-label">幸运颜色</span>
              <span className="lucky-value">{horoscope.luckyColor}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-label">幸运方向</span>
              <span className="lucky-value">{horoscope.luckyDirection}</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Horoscope;