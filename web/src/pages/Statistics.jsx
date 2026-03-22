import useVisitStats from '../hooks/useVisitStats';
import PieChart from '../components/PieChart';
import './Statistics.css';

function Statistics() {
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
    if (window.confirm('确定要清除所有访问记录吗？此操作不可恢复。')) {
      clearAllStats();
      alert('访问记录已清除');
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

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'desktop': return '💻';
      case 'tablet': return '📱';
      case 'mobile': return '📱';
      default: return '💻';
    }
  };

  const getDeviceLabel = (deviceType) => {
    switch (deviceType) {
      case 'desktop': return '桌面';
      case 'tablet': return '平板';
      case 'mobile': return '手机';
      default: return '未知';
    }
  };

  if (!isInitialized) {
    return (
      <div className="statistics">
        <h1 className="page-title">访问统计</h1>
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
      <h1 className="page-title">访问统计</h1>

      {/* Overview Cards */}
      <div className="stats-overview">
        <div className="stat-card">
          <span className="stat-value">{totalSessions}</span>
          <span className="stat-label">总会话数</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalQuestions}</span>
          <span className="stat-label">总提问数</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{todayQuestions}</span>
          <span className="stat-label">今日提问</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{weekQuestions}</span>
          <span className="stat-label">本周提问</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{avgPerSession}</span>
          <span className="stat-label">平均/会话</span>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="stats-charts">
        <PieChart data={deviceStats} size={180} title="设备分布" />
        <PieChart data={osStats} size={180} title="操作系统" />
      </div>

      {/* Recent Records */}
      <div className="recent-records">
        <h3 className="recent-records-title">最近访问记录</h3>
        {recentRecords.length === 0 ? (
          <p className="no-records">暂无访问记录</p>
        ) : (
          <div className="records-table">
            <div className="records-header">
              <span className="col-index">#</span>
              <span className="col-time">访问时间</span>
              <span className="col-device">设备</span>
              <span className="col-questions">提问数</span>
            </div>
            {recentRecords.map((record, index) => (
              <div key={record.sessionId} className="records-row">
                <span className="col-index">{recentRecords.length - index}</span>
                <span className="col-time">{formatTime(record.lastVisit)}</span>
                <span className="col-device">
                  <span className="device-icon">{getDeviceIcon(record.deviceType)}</span>
                  <span className="device-label">{getDeviceLabel(record.deviceType)}</span>
                </span>
                <span className="col-questions">{record.questionCount}次</span>
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
          清除所有记录
        </button>
      </div>
    </div>
  );
}

export default Statistics;