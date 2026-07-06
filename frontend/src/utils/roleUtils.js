export const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

export const getDashboardPath = (role) => {
  const dashboardPaths = {
    SUPER_ADMIN: "/super-admin/dashboard",
    SUPERADMIN: "/super-admin/dashboard",
    COMPANY_ADMIN: "/company-admin/dashboard",
    ADMIN: "/company-admin/dashboard",
    EMPLOYEE: "/employee/dashboard",
    EMPLOYEES: "/employee/dashboard",
  };

  return dashboardPaths[normalizeRole(role)] || "/";
};

export const roleMatches = (actualRole, allowedRoles = []) => {
  const normalizedActual = normalizeRole(actualRole);
  return allowedRoles.map(normalizeRole).includes(normalizedActual);
};
