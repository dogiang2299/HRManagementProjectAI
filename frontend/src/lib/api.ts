import { BASE_URL } from "../constant/config";
import axios from "axios";
import { useAuthStore } from "../modules/auth/store/auth.store";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 1000 * 60 * 30 * 3,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const clearAuthState = () => {
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isAuthenticated: false,
  });
  localStorage.removeItem("auth-storage");
};

const isCandidatePath = () => window.location.pathname.startsWith("/it-job");

apiClient.interceptors.request.use(
  function (config) {
    const authFreeUrls = ["auth/login", "it-job/login", "it-job/register"];
    if (config.url && authFreeUrls.some((path) => config.url?.includes(path))) {
      return config;
    }

    const storageData = localStorage.getItem("auth-storage");
    let token = null;

    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        token = parsedData?.state?.accessToken;
      } catch (e) {
        token = null;
      }
    }

    if (!token) {
      const publicAuthPaths = ["/login", "/it-job/login", "/it-job/register"];
      if (!publicAuthPaths.includes(window.location.pathname)) {
        if (isCandidatePath()) {
          clearAuthState();
        } else {
          useAuthStore.getState().logout();
        }
      }

      const controller = new AbortController();
      config.signal = controller.signal;
      controller.abort();

      return Promise.reject({
        message: "Token not found or invalid in storage",
        code: 401,
        custom: true,
      });
    }

    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  function (response) {
    return response;
  },
  async function (error) {
    const status = error?.response?.status;

    if (status === 401) {
      const publicAuthPaths = ["/login", "/it-job/login", "/it-job/register"];
      if (!publicAuthPaths.includes(window.location.pathname)) {
        if (isCandidatePath()) {
          clearAuthState();
        } else {
          useAuthStore.getState().logout();
        }
      }

      return Promise.reject({
        message: error.response?.data?.message || "Unauthorized",
        code: 401,
        custom: true,
      });
    }

    if (status === 403) {
      return Promise.reject({
        message: error.response?.data?.message || "No access to Recruitment tool",
        code: 403,
        custom: true,
      });
    }

    if (status === 404) {
      return Promise.reject({
        message: "Not found",
        code: 404,
        custom: true,
        data: error.response?.data,
      });
    }

    if (status === 500) {
      return Promise.reject({
        message: "Internal Server Error",
        code: 500,
        custom: true,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;