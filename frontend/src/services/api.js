// import axios from "axios";

import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_BASE_URL || "http://localhost:8081/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Each bounded context has its own service during local development. Keeping
// the clients in one module makes switching to an API gateway a one-line env
// change later and guarantees identical JWT/error behaviour everywhere.
export const createServiceClient = (envKey, fallback) => axios.create({
  baseURL: import.meta.env[envKey] || fallback,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (window.location.pathname !== "/login") {
        window.location.assign("/login?expired=1");
      }
    }

    return Promise.reject(error);
  }
);

const attachInterceptors = (client) => {
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.assign("/login?expired=1");
    }
    return Promise.reject(error);
  });
  return client;
};

export const COMPANY_API = attachInterceptors(createServiceClient(
  "VITE_COMPANY_API_BASE_URL", "http://localhost:8082"
));
export const ASSET_API = attachInterceptors(createServiceClient(
  "VITE_ASSET_API_BASE_URL", "http://localhost:8083"
));

export default API;

// const API = axios.create({
//   // Keep Express as the default until VITE_API_BASE_URL points at a Spring service gateway.
//   baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
//   timeout: 15000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// API.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// API.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       if (window.location.pathname !== '/login') window.location.assign('/login?expired=1');
//     }
//     return Promise.reject(error);
//   }
// );

// export default API;
