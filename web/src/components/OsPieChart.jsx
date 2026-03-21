import PropTypes from 'prop-types';
import PieChart from './PieChart';
import './OsPieChart.css';

function OsPieChart({ data, size = 200, title }) {
  return (
    <div className="os-pie-chart-container">
      <PieChart data={data} size={size} title={title} />
    </div>
  );
}

OsPieChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    color: PropTypes.string,
    icon: PropTypes.string
  })),
  size: PropTypes.number,
  title: PropTypes.string
};

export default OsPieChart;