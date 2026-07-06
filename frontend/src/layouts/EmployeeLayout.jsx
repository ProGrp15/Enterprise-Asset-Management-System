import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import EmployeeSidebar from "../components/sidebar/EmployeeSidebar";
import { logout } from "../store/authSlice";

const EmployeeLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout bg-light">
      <EmployeeSidebar />
      <main className="app-main">
        <header className="app-topbar bg-white border-bottom">
          <div>
            <div className="fw-semibold">{user?.fullName || "Employee"}</div>
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

export default EmployeeLayout;
