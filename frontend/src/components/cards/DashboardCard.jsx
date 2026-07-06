const DashboardCard = ({ title, children }) => {
  return (
    <section className="bg-white border rounded p-4 h-100">
      {title && <h2 className="h5 fw-semibold mb-3">{title}</h2>}
      {children}
    </section>
  );
};

export default DashboardCard;
