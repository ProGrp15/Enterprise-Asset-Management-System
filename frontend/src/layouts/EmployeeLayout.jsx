import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import AppShell from '../components/layout/AppShell';
import { logout } from "../store/authSlice";

const EmployeeLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return <AppShell role="employee">{children}</AppShell>;
};

export default EmployeeLayout;
