import API from "./api";

export const getCompanyAdminDashboard = async () => {
  const response = await API.get("/dashboard/company-admin");
  return response.data;
};

export const getSuperAdminDashboard = async () => {
  const response = await API.get("/dashboard/super-admin");
  return response.data;
};

export const getEmployeeDashboard = async () => {
  const response = await API.get("/dashboard/employee");
  return response.data;
};
