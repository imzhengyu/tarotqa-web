import useVisitStats from '../hooks/useVisitStats';
import PieChart from '../components/PieChart';
import { useLanguage } from '../context/LanguageContext';
import { useBackToTop } from '../hooks/useBackToTop';
import './Statistics.css';

function Statistics() {
  const { t } = useLanguage();
  const { showBackToTop, scrollToTop } = useBackToTop();
  const {
    isInitialized,
    stats,
    clearAllStats,
    getTodayQuestions,
    getWeekQuestions,
    getRecentRecords,
    getDeviceStatsWithPercentage,
    getOsStatsWithPercentage
  } = useVisitStats();

  const handleClearAllStats = () => {
    if (window.confirm(t('确定要清除所有访问记录吗？此操作不可恢复。', 'Are you sure you want to clear all records? This cannot be undone.'))) {
      clearAllStats();
      alert(t('访问记录已清除', 'Records cleared'));
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
  };

  const DEVICE_ICONS = { desktop: '💻', tablet: '📱', mobile: '📱' };
  const DEVICE_LABELS = {
    desktop: t('桌面', 'Desktop'),
    tablet: t('平板', 'Tablet'),
    mobile: t('手机', 'Mobile')
  };

  const getDeviceIcon = (deviceType) => DEVICE_ICONS[deviceType] || '💻';
  const getDeviceLabel = (deviceType) => DEVICE_LABELS[deviceType] || t('未知', 'Unknown');

  if (!isInitialized) {
    return (
      <div className="statistics">
        <h1 className="page-title">{t('访问统计', 'Visit Statistics')}</h1>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const totalSessions = stats.totalSessions;
  const totalQuestions = stats.totalQuestions;
  const avgPerSession = totalSessions > 0 ? (totalQuestions / totalSessions).toFixed(1) : '0.0';
  const todayQuestions = getTodayQuestions();
  const weekQuestions = getWeekQuestions();
  const deviceStats = getDeviceStatsWithPercentage();
  const osStats = getOsStatsWithPercentage();
  const recentRecords = getRecentRecords(10);

  return (
    <div className="statistics">
      <h1 className="page-title">{t('访问统计', 'Visit Statistics')}</h1>

      {/* Overview Cards */}
      <div className="stats-overview">
        <div className="stat-card">
          <span className="stat-value">{totalSessions}</span>
          <span className="stat-label">{t('总会话数', 'Total Sessions')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalQuestions}</span>
          <span className="stat-label">{t('总提问数', 'Total Questions')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{todayQuestions}</span>
          <span className="stat-label">{t('今日提问', 'Today')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{weekQuestions}</span>
          <span className="stat-label">{t('本周提问', 'This Week')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{avgPerSession}</span>
          <span className="stat-label">{t('平均/会话', 'Avg/Session')}</span>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="stats-charts">
        <PieChart data={deviceStats} size={180} title={t('设备分布', 'Device Distribution')} />
        <PieChart data={osStats} size={180} title={t('操作系统', 'Operating System')} />
      </div>

      {/* Recent Records */}
      <div className="recent-records">
        <h3 className="recent-records-title">{t('最近访问记录', 'Recent Records')}</h3>
        {recentRecords.length === 0 ? (
          <p className="no-records">{t('暂无访问记录', 'No records yet')}</p>
        ) : (
          <div className="records-table">
            <div className="records-header">
              <span className="col-index">#</span>
              <span className="col-time">{t('访问时间', 'Time')}</span>
              <span className="col-device">{t('设备', 'Device')}</span>
              <span className="col-questions">{t('提问数', 'Questions')}</span>
            </div>
            {recentRecords.map((record, index) => (
              <div key={record.sessionId} className="records-row">
                <span className="col-index">{recentRecords.length - index}</span>
                <span className="col-time">{formatTime(record.lastVisit)}</span>
                <span className="col-device">
                  <span className="device-icon">{getDeviceIcon(record.deviceType)}</span>
                  <span className="device-label">{getDeviceLabel(record.deviceType)}</span>
                </span>
                <span className="col-questions">{record.questionCount}{t('次', ' times')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear Button */}
      <div className="stats-actions">
        <button
          className="btn btn-secondary"
          onClick={handleClearAllStats}
        >
          {t('清除所有记录', 'Clear All Records')}
        </button>
      </div>
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title={t('回到顶部', 'Back to Top')} data-tooltip={t('回到顶部', 'Back to Top')}>
          <svg viewBox="0 0 24 24"><path d="M3 12l9-9 9 9M5 10.5v10.5h14V10.5" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
    </div>
  );
}

export default Statistics;
