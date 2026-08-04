import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="container text-center py-5">
    <h1 className="display-4">404</h1>
    <p className="lead text-secondary">Page not found.</p>
    <Link className="btn btn-primary" to="/">
      Go Home
    </Link>
  </div>
);

export default NotFound;
