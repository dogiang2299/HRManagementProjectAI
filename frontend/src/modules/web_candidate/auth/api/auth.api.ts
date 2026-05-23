import apiClient from "../../../../lib/api";

export type CandidateRegisterPayload = {
  employee_name?: string;
  email_account: string;
  phone_account: string;
  password: string;
};

export type CandidateLoginPayload = {
  phone_account: string;
  password: string;
};

export const candidateAuthApi = {
  register: async (payload: CandidateRegisterPayload) => {
    const response = await apiClient.post("/it-job/register", payload);
    return response.data;
  },
  login: async (payload: CandidateLoginPayload) => {
    const response = await apiClient.post("/it-job/login", payload);
    return response.data;
  },
};
