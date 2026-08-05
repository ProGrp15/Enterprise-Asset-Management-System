import { employees, departments } from "./companyService";
import { assets, requests, maintenance, purchaseOrders } from "./assetService";
import { getNotificationDashboard } from "./notificationService";
import { getProfile } from "./authService";
import { getPlatformCompanies } from "./authService";

const safe = (promise) => promise.catch(() => []);
const list = (value) => Array.isArray(value) ? value : (value?.content || value?.items || []);

export const getCompanyAdminDashboard = async () => {
  const [assetData, employeeData, departmentData, requestData, maintenanceData, purchaseData, notificationData, profile] = await Promise.all([
    safe(assets.list()), safe(employees.list()), safe(departments.list()), safe(requests.list()),
    safe(maintenance.list()), safe(purchaseOrders.list()), safe(getNotificationDashboard()), safe(getProfile()),
  ]);
  const assetRows = list(assetData), employeeRows = list(employeeData), departmentRows = list(departmentData), requestRows = list(requestData);
  return {
    assets: assetRows, employees: employeeRows, departments: departmentRows,
    requests: requestRows, maintenance: list(maintenanceData), purchaseOrders: list(purchaseData), notifications: notificationData || {},
    company: profile?.company || null,
    stats: { employees: employeeRows.length, admins: 0, assets: assetRows.length, requests: requestRows.filter(x => String(x.status || 'PENDING').toUpperCase() === 'PENDING').length, departments: departmentRows.length },
  };
};

export const getSuperAdminDashboard = async () => {
  const [companies, dashboard] = await Promise.all([safe(getPlatformCompanies()), getCompanyAdminDashboard()]);
  return { ...dashboard, companies: list(companies), stats: { companies: list(companies).length, users: dashboard.employees.length, assets: dashboard.assets.length } };
};
export const getEmployeeDashboard = async () => {
  const [assetData, requestData, profile, notificationData] = await Promise.all([safe(assets.list()), safe(requests.list()), safe(getProfile()), safe(getNotificationDashboard())]);
  const assigned = list(assetData); const requestRows = list(requestData);
  return { assets: assigned, requests: requestRows, notifications: notificationData || {}, employee: profile?.user || profile, company: profile?.company || null, stats: { assignedAssets: assigned.filter(x => String(x.status || '').toUpperCase() !== 'DISPOSED').length, openRequests: requestRows.filter(x => String(x.status || 'PENDING').toUpperCase() === 'PENDING').length, notifications: notificationData?.unreadNotifications ?? notificationData?.notifications ?? 0 } };
};
