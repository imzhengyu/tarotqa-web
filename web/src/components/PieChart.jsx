import './PieChart.css';

function PieChart({ data, size = 200, title }) {
  if (!data || data.length === 0 || data.every(item => item.count === 0)) {
    return (
      <div className="pie-chart-container">
        {title && <h4 className="pie-chart-title">{title}</h4>}
        <div className="pie-chart-empty" style={{ width: size, height: size }}>
          <span>暂无数据</span>
        </div>
      </div>
    );
  }

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Build conic-gradient segments
  let gradientParts = [];
  let currentAngle = 0;

  data.forEach(item => {
    if (item.count === 0) return;
    const percentage = (item.count / total) * 100;
    const angle = (percentage / 100) * 360;
    gradientParts.push(`${item.color} ${currentAngle}deg ${currentAngle + angle}deg`);
    currentAngle += angle;
  });

  const gradient = gradientParts.length > 0
    ? `conic-gradient(${gradientParts.join(', ')})`
    : '#333';

  return (
    <div className="pie-chart-container">
      {title && <h4 className="pie-chart-title">{title}</h4>}
      <div className="pie-chart-wrapper">
        <div
          className="pie-chart"
          style={{
            width: size,
            height: size,
            background: gradient
          }}
        >
          <div className="pie-chart-inner">
            <span className="pie-chart-total">{total}</span>
            <span className="pie-chart-label">总会话</span>
          </div>
        </div>
        <div className="pie-chart-legend">
          {data.map((item, index) => (
            <div key={index} className="pie-chart-legend-item">
              <span
                className="pie-chart-legend-color"
                style={{ backgroundColor: item.color }}
              />
              <span className="pie-chart-legend-icon">{item.icon || ''}</span>
              <span className="pie-chart-legend-label">{item.label}</span>
              <span className="pie-chart-legend-value">{item.count}</span>
              <span className="pie-chart-legend-percentage">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PieChart;