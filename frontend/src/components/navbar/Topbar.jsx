const Topbar = ({ title, actions }) => {
  return (
    <div className="bg-white border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
      <h1 className="h5 fw-semibold mb-0">{title}</h1>
      {actions}
    </div>
  );
};

export default Topbar;
