const DashboardCard = ({ title, children, className = "" }) => {
  return (
    <section className={`surface h-100 ${className}`}>
      {title && <h2 className="h5 fw-bold mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</h2>}
      {children}
    </section>
  );
};

export default DashboardCard;
