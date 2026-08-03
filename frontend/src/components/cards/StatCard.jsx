import { FaChartBar } from "react-icons/fa";

const StatCard = ({ title, value, subtitle, icon: Icon = FaChartBar, color = "var(--brand)" }) => {
  return (
    <div className="stat-card hover-lift">
      <div className="stat-icon" style={{ color: color, background: `${color}1A` }}>
        <Icon />
      </div>
      <div className="text-secondary fw-semibold mb-1" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <small className="text-muted mt-2 fw-medium">{subtitle}</small>}
    </div>
  );
};

export default StatCard;
