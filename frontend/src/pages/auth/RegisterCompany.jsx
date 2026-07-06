import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { registerCompany } from "../../services/authService";
import { loginSuccess } from "../../store/authSlice";
import { getDashboardPath } from "../../utils/roleUtils";

const RegisterCompany = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    adminName: "",
    officialEmail: "",
    mobileNumber: "",
    companySize: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await registerCompany(formData);

      if (response.success) {
        setSuccess(
          response.message || "Company registered successfully!"
        );

        if (response.user && response.token) {
          dispatch(
            loginSuccess({
              user: response.user,
              token: response.token,
            })
          );

          navigate(getDashboardPath(response.user.role), {
            replace: true,
          });
          return;
        }

        navigate("/company-admin/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">

          <div className="card shadow border-0">
            <div className="card-body p-5">

              <h2 className="fw-bold mb-4 text-center">
                Register Your Company
              </h2>

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="companyName"
                      placeholder="ABC Pvt Ltd"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Industry
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="industry"
                      placeholder="IT Services"
                      value={formData.industry}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Admin Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="adminName"
                      placeholder="John Doe"
                      value={formData.adminName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Official Email
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="officialEmail"
                      placeholder="admin@company.com"
                      value={formData.officialEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Mobile Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="mobileNumber"
                      placeholder="+91 XXXXXXXXXX"
                      value={formData.mobileNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Company Size
                    </label>
                    <select
                      className="form-select"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                    >
                      <option value="">
                        Select
                      </option>
                      <option value="1-50">
                        1-50 Employees
                      </option>
                      <option value="51-200">
                        51-200 Employees
                      </option>
                      <option value="201-500">
                        201-500 Employees
                      </option>
                      <option value="500+">
                        500+ Employees
                      </option>
                    </select>
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      placeholder="Create Password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mt-3"
                  disabled={loading}
                >
                  {loading
                    ? "Registering..."
                    : "Register Company"}
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
