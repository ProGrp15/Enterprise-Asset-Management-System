import { employees, departments } from "./companyService";
import { assets, requests, maintenance, purchaseOrders } from "./assetService";

const safe = (promise) => promise.catch(() => []);
const list = (value) => Array.isArray(value) ? value : (value?.content || value?.items || []);

export const getCompanyAdminDashboard = async () => {
  const [assetData, employeeData, departmentData, requestData, maintenanceData, purchaseData] = await Promise.all([
    safe(assets.list()), safe(employees.list()), safe(departments.list()), safe(requests.list()),
    safe(maintenance.list()), safe(purchaseOrders.list()),
  ]);
  return {
    assets: list(assetData), employees: list(employeeData), departments: list(departmentData),
    requests: list(requestData), maintenance: list(maintenanceData), purchaseOrders: list(purchaseData),
  };
};

export const getSuperAdminDashboard = getCompanyAdminDashboard;
export const getEmployeeDashboard = async () => {
  const [assetData, requestData] = await Promise.all([safe(assets.list()), safe(requests.list())]);
  return { assets: list(assetData), requests: list(requestData), notifications: [] };
};
