import { Link } from "react-router-dom";

const ResetPassword = () => {
  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">

          <div className="col-lg-5">
            <div className="card shadow border-0">
              <div className="card-body p-5">

                <h2 className="fw-bold text-center mb-3">
                  Reset Password
                </h2>

                <p className="text-center text-secondary mb-4">
                  Create a new password for your account.
                </p>

                <form>

                  <div className="mb-3">
                    <label className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <button className="btn btn-primary w-100">
                    Reset Password
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

export default ResetPassword;