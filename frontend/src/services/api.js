import axios from "axios";

// Reads from frontend/.env → VITE_API_URL=https://crm-xz3b.onrender.com
const API_BASE = import.meta.env.VITE_API_URL || "https://crm-xz3b.onrender.com";

// Full base: https://crm-xz3b.onrender.com/api
// Usage: api.post('/auth/login') → POST https://crm-xz3b.onrender.com/api/auth/login ✅
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