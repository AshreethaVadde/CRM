import axios from "axios";

const API_BASE = "https://crm-xz3b.onrender.com";

// Create Axios instance with explicit full /api base
const api = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 10000,
});

// Request Interceptor — attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor — handle common errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("❌ Backend server is not reachable:", error.message);
    }

    // Token expired — force logout
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;