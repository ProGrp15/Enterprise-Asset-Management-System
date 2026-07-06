const StatCard = ({ title, value, subtitle }) => {
  return (
    <div className="bg-white border rounded p-4 h-100">
      <div className="text-secondary">{title}</div>
      <div className="display-6 fw-bold">{value}</div>
      {subtitle && <small className="text-secondary">{subtitle}</small>}
    </div>
  );
};

export default StatCard;
