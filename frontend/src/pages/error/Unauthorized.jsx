import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="container text-center py-5">
      <h1 className="display-5 fw-bold">Unauthorized</h1>
      <p className="lead text-secondary">
        You do not have permission to view this page.
      </p>
      <Link to="/login" className="btn btn-primary">
        Back to Login
      </Link>
    </div>
  );
};

export default Unauthorized;
