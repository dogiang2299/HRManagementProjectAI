import axios from "axios";
import apiClient from "../../../lib/api";
import type { LoginRespone } from "../types";

export const authApi = {
  login: async (phone_account: string, password: string) => {
    const respone = await apiClient.post<LoginRespone>("/auth/login", {
      phone_account,
      password,
    });
    return respone.data;
  },
  checkUser: async (phone_account: string) => {
    const response = await axios.post(
      `${apiClient.defaults.baseURL}/auth/check-user`,
      {
        phone_account: phone_account,
      },
    );
    const raw = response.data?.data ?? response.data ?? null;

    return raw;
  },

  changePassword: async (userId: string, newPass: string) => {
    const response = await axios.post(
      `${apiClient.defaults.baseURL}/auth/change-password`,
      {
        user_id: userId,
        new_password: newPass,
      },
    );
    return response.data;
  },
};
