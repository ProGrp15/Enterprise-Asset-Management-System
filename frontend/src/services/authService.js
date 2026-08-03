import API from "./api";

const extractMessage = (payload) =>
  payload?.message ||
  payload?.error ||
  payload?.data?.message ||
  payload?.data?.error ||
  "Request failed";

const normalizeAuthResponse = (payload) => {
  const data = payload?.data ?? payload;
  if (!data) {
    return payload;
  }

  if (data.accessToken || data.refreshToken) {
    return {
      token: data.accessToken || data.token,
      refreshToken: data.refreshToken || null,
      user: data.user,
      company: data.company || null,
      permissions: data.permissions || [],
      raw: data,
    };
  }

  return {
    token: data.token || data.accessToken,
    refreshToken: data.refreshToken || null,
    user: data.user,
    company: data.company || null,
    permissions: data.permissions || [],
    raw: data,
  };
};

export const login = async (loginData) => {
  const response = await API.post(
    "/auth/login",
    loginData
  );

  return normalizeAuthResponse(response.data);
};

export const registerCompany = async (formData) => {
  const response = await API.post(
    "/auth/register-company",
    formData
  );

  return normalizeAuthResponse(response.data);
};

export const getProfile = async () => {
  const response = await API.get(
    "/auth/profile"
  );

  return normalizeAuthResponse(response.data);
};

export const forgotPassword = async (email) => {
  const response = await API.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (payload) => {
  const response = await API.post("/auth/reset-password", payload);
  return response.data;
};

export const refreshToken = async (token) => {
  const response = await API.post('/auth/refresh-token', { refreshToken: token });
  return normalizeAuthResponse(response.data);
};
export const changePassword = async (payload) => (await API.post('/auth/change-password', payload)).data;
export const logout = async () => (await API.post('/auth/logout')).data;
export const getPermissions = async () => (await API.get('/auth/permissions')).data?.data || [];
export const assignRolePermissions = async (roleId, permissionIds) => (await API.put(`/auth/permissions/role/${roleId}`, { permissionIds })).data;
export const getPlatformCompanies = async () => (await API.get('/platform/companies')).data?.data || [];
export const updatePlatformCompanyStatus = async (id, active) => (await API.put(`/platform/companies/${id}/status`, { active })).data;

export const getApiErrorMessage = (error) => {
  if (!error) return "Something went wrong.";
  if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (!error.response) return "Network error. Please check your connection.";
  return extractMessage(error.response.data) || `Request failed with status ${error.response.status}`;
};
