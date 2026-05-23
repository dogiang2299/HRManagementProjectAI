import { BASE_URL } from "../constant/config";
import axios from "axios";

export const publicApiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 1000 * 60 * 30 * 3,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

publicApiClient.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const status = error?.response?.status;

    if (status === 403) {
      return Promise.reject({
        message: error.response?.data?.message || "Forbidden",
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

export default publicApiClient;