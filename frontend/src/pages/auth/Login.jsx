import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBuilding } from "react-icons/fa";
import { useDispatch } from "react-redux";

import { login } from "../../services/authService";
import { loginSuccess } from "../../store/authSlice";
import { getDashboardPath } from "../../utils/roleUtils";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Login
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await login(formData);

      if (response.success) {
        // Save user + token in Redux
        dispatch(
          loginSuccess({
            user: response.user,
            token: response.token,
          })
        );

        // Save user info (optional)
        localStorage.setItem(
          "user",
          JSON.stringify(response.user)
        );

        navigate(getDashboardPath(response.user.role), {
          replace: true,
        });
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid bg-light min-vh-100 d-flex align-items-center">
      <div className="container">
        <div className="row shadow rounded overflow-hidden bg-white">

          {/* Left Section */}
          <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center bg-primary text-white p-5">
            <FaBuilding size={70} className="mb-4" />
            <h2 className="fw-bold">Welcome to AssetFlow</h2>
            <p className="text-center mt-3">
              Manage your organization's assets, inventory,
              employees and requests from one centralized platform.
            </p>
          </div>

          {/* Right Section */}
          <div className="col-lg-6 p-5">
            <h2 className="fw-bold mb-4">Login</h2>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              <div className="mb-3">
                <label className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="d-flex justify-content-between mb-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="remember"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="remember"
                  >
                    Remember Me
                  </label>
                </div>

                <Link
                  to="/forgot-password"
                  className="text-decoration-none"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Login"}
              </button>

              <p className="text-center mb-0">
                New Company?{" "}
                <Link to="/register-company">
                  Register Here
                </Link>
              </p>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;

// import { Link } from "react-router-dom";
// import { FaBuilding } from "react-icons/fa";

// const Login = () => {
//   return (
//     <div className="container-fluid bg-light min-vh-100 d-flex align-items-center">
//       <div className="container">
//         <div className="row shadow rounded overflow-hidden bg-white">

//           {/* Left Section */}
//           <div className="col-lg-6 d-none d-lg-flex flex-column justify-content-center align-items-center bg-primary text-white p-5">
//             <FaBuilding size={70} className="mb-4" />
//             <h2 className="fw-bold">Welcome to AssetFlow</h2>
//             <p className="text-center mt-3">
//               Manage your organization's assets, inventory,
//               employees and requests from one centralized platform.
//             </p>
//           </div>

//           {/* Right Section */}
//           <div className="col-lg-6 p-5">
//             <h2 className="fw-bold mb-4">Login</h2>

//             <form>
//               <div className="mb-3">
//                 <label className="form-label">Email Address</label>
//                 <input
//                   type="email"
//                   className="form-control"
//                   placeholder="Enter email"
//                 />
//               </div>

//               <div className="mb-3">
//                 <label className="form-label">Password</label>
//                 <input
//                   type="password"
//                   className="form-control"
//                   placeholder="Enter password"
//                 />
//               </div>

//               <div className="d-flex justify-content-between mb-4">
//                 <div className="form-check">
//                   <input className="form-check-input" type="checkbox" />
//                   <label className="form-check-label">
//                     Remember Me
//                   </label>
//                 </div>

//                 <Link to="/forgot-password" className="text-decoration-none">
//                   Forgot Password?
//                 </Link>
//               </div>

//               <button className="btn btn-primary w-100 mb-3">
//                 Login
//               </button>

//               <p className="text-center">
//                 New Company?{" "}
//                 <Link to="/register-company">
//                   Register Here
//                 </Link>
//               </p>
//             </form>
//           </div>

//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;
