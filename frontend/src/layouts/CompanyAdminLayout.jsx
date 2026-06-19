import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import CompanyAdminSidebar from "../components/sidebar/CompanyAdminSidebar";
import { logout } from "../store/authSlice";

const CompanyAdminLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout bg-light">
      <CompanyAdminSidebar />
      <main className="app-main">
        <header className="app-topbar bg-white border-bottom">
          <div>
            <div className="fw-semibold">{user?.fullName || "Company Admin"}</div>
            <small className="text-secondary">{user?.email}</small>
          </div>
          <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </header>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
};

export default CompanyAdminLayout;
