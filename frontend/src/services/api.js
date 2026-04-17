import axios from "axios";

// Create Axios instance
const api = axios.create({
  baseURL: "https://crm-xz3b.onrender.com/api",
  timeout: 10000, // prevents hanging requests
});

// Request Interceptor (Attach Token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor (Handle Errors Globally)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Backend not running / connection refused
    if (!error.response) {
      console.error("Backend server is not reachable");
      alert("Server is not running. Please try again later.");
    }

    // Unauthorized (token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;