import API from "./api";

export const login = async (loginData) => {
  const response = await API.post(
    "/auth/login",
    loginData
  );

  return response.data;
};

export const registerCompany = async (formData) => {
  const response = await API.post(
    "/auth/register-company",
    formData
  );

  return response.data;
};

export const getProfile = async () => {
  const response = await API.get(
    "/auth/profile"
  );

  return response.data;
};