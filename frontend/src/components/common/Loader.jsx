const Loader = ({ label = "Loading..." }) => {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-3">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};

export default Loader;
