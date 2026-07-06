import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import CompanyAdminLayout from "../layouts/CompanyAdminLayout";
import EmployeeLayout from "../layouts/EmployeeLayout";
import SuperAdminLayout from "../layouts/SuperAdminLayout";

import Home from "../pages/landing/Home";
import About from "../pages/landing/About";
import Pricing from "../pages/landing/Pricing";
import Contact from "../pages/landing/Contact";

import Login from "../pages/auth/Login";
import RegisterCompany from "../pages/auth/RegisterCompany";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import CompanyAdminDashboard from "../pages/company-admin/Dashboard";
import CompanyAdminEmployees from "../pages/company-admin/Employees";
import CompanyAdminAssets from "../pages/company-admin/Assets";
import SuperAdminDashboard from "../pages/super-admin/Dashboard";
import SuperAdminCompanies from "../pages/super-admin/Companies";
import SuperAdminAnalytics from "../pages/super-admin/Analytics";
import EmployeeDashboard from "../pages/employee/Dashboard";
import EmployeeMyAssets from "../pages/employee/MyAssets";
import EmployeeProfile from "../pages/employee/Profile";
import Unauthorized from "../pages/error/Unauthorized";

import RoleBasedRoute from "./RoleBasedRoute";

const companyAdminRoute = (children) => (
  <RoleBasedRoute allowedRoles={["COMPANY_ADMIN", "ADMIN"]}>
    <CompanyAdminLayout>{children}</CompanyAdminLayout>
  </RoleBasedRoute>
);

const superAdminRoute = (children) => (
  <RoleBasedRoute allowedRoles={["SUPER_ADMIN", "SUPERADMIN"]}>
    <SuperAdminLayout>{children}</SuperAdminLayout>
  </RoleBasedRoute>
);

const employeeRoute = (children) => (
  <RoleBasedRoute allowedRoles={["EMPLOYEE", "EMPLOYEES"]}>
    <EmployeeLayout>{children}</EmployeeLayout>
  </RoleBasedRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />
      <Route
        path="/about"
        element={
          <MainLayout>
            <About />
          </MainLayout>
        }
      />
      <Route
        path="/pricing"
        element={
          <MainLayout>
            <Pricing />
          </MainLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <MainLayout>
            <Contact />
          </MainLayout>
        }
      />

      <Route path="/login" element={<Login />} />
      <Route path="/register-company" element={<RegisterCompany />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/company-admin"
        element={<Navigate to="/company-admin/dashboard" replace />}
      />
      <Route
        path="/company-admin/dashboard"
        element={companyAdminRoute(<CompanyAdminDashboard />)}
      />
      <Route
        path="/company-admin/employees"
        element={companyAdminRoute(<CompanyAdminEmployees />)}
      />
      <Route
        path="/company-admin/assets"
        element={companyAdminRoute(<CompanyAdminAssets />)}
      />

      <Route
        path="/super-admin"
        element={<Navigate to="/super-admin/dashboard" replace />}
      />
      <Route
        path="/super-admin/dashboard"
        element={superAdminRoute(<SuperAdminDashboard />)}
      />
      <Route
        path="/super-admin/companies"
        element={superAdminRoute(<SuperAdminCompanies />)}
      />
      <Route
        path="/super-admin/analytics"
        element={superAdminRoute(<SuperAdminAnalytics />)}
      />

      <Route
        path="/employee"
        element={<Navigate to="/employee/dashboard" replace />}
      />
      <Route
        path="/employee/dashboard"
        element={employeeRoute(<EmployeeDashboard />)}
      />
      <Route
        path="/employee/my-assets"
        element={employeeRoute(<EmployeeMyAssets />)}
      />
      <Route
        path="/employee/profile"
        element={employeeRoute(<EmployeeProfile />)}
      />

      <Route
        path="*"
        element={
          <MainLayout>
            <div className="container text-center py-5">
              <h1 className="display-4">404</h1>
              <p className="lead">Page Not Found</p>
            </div>
          </MainLayout>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
