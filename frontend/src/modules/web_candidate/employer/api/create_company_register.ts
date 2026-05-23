import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import publicApiClient from "../../../../lib/public-api";

export type CreateEmployerRegistrationPayload = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source?: string;
  companyName: string;
  email: string;
  phone: string;
  address?: string;
  website?: string;
  recruitmentNeeds?: string;
  status?: "pending" | "approved" | "rejected";
  is_active?: boolean;
};

export const createEmployerRegistration = async (
  payload: CreateEmployerRegistrationPayload,
) => {
  const response = await publicApiClient.post("/company-register", payload);
  return response.data?.data ?? response.data;
};

export const useCreateEmployerRegistration = (
  config?: Omit<
    UseMutationOptions<
      unknown,
      Error,
      CreateEmployerRegistrationPayload
    >,
    "mutationFn"
  >,
) => {
  return useMutation({
    mutationFn: createEmployerRegistration,
    ...config,
  });
};
