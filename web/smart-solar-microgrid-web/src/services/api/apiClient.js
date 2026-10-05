import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5130/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
 * Attach the stored JWT access token to protected API requests.
 * Public requests such as login are sent normally when no token exists.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/*
 * Handle expired or invalid authenticated sessions centrally.
 *
 * A normal failed login can also return HTTP 401, so authentication
 * data is cleared only when an access token already exists.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasStoredToken = Boolean(localStorage.getItem("accessToken"));

    if (error?.response?.status === 401 && hasStoredToken) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");

      window.dispatchEvent(new Event("auth:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export default apiClient;
