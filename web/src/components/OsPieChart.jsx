import PieChart from './PieChart';
import './OsPieChart.css';

function OsPieChart({ data, size = 200, title }) {
  return (
    <div className="os-pie-chart-container">
      <PieChart data={data} size={size} title={title} />
    </div>
  );
}

export default OsPieChart;