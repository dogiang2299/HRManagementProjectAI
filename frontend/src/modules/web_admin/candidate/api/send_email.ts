import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";

export type SendEmailDTO = {
  candidate_id: string;
  template_id?: string;
  subject?: string;
  body?: string;
};

export type SendEmailResponse = {
  message: string;
  data: {
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    template_id: string | null;
    subject: string;
  };
};

const sendEmail = async (data: SendEmailDTO): Promise<SendEmailResponse> => {
  const res = await apiClient.post("candidate-email/send", data);
  // Backend returns { message, data: {...} }
  const parsed = res.data?.data ? { message: res.data.message, data: res.data.data } : res.data;
  return parsed as SendEmailResponse;
};

type UseSendEmailOptions = {
  config?: UseMutationOptions<SendEmailResponse, Error, SendEmailDTO>;
};

export const useSendEmail = ({ config }: UseSendEmailOptions = {}) => {
  return useMutation({
    mutationFn: sendEmail,
    ...config,
  });
};
