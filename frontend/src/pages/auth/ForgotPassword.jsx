import { Link } from "react-router-dom";

const ForgotPassword = () => {
  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">

          <div className="col-lg-5">
            <div className="card shadow border-0">
              <div className="card-body p-5">

                <h2 className="fw-bold text-center mb-3">
                  Forgot Password
                </h2>

                <p className="text-center text-secondary mb-4">
                  Enter your registered email address to receive a password reset link.
                </p>

                <form>
                  <div className="mb-4">
                    <label className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                    />
                  </div>

                  <button className="btn btn-primary w-100">
                    Send Reset Link
                  </button>
                </form>

                <div className="text-center mt-4">
                  <Link to="/login">
                    Back to Login
                  </Link>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;