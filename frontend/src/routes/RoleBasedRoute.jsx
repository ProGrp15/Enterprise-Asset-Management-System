import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { roleMatches } from "../utils/roleUtils";

const RoleBasedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, token, user } = useSelector((state) => state.auth);

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  if (!roleMatches(user?.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleBasedRoute;
