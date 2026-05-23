import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_SEND_EMAIL } from "../../../../../constant/config";
import type { ISettingEmail } from "../types";

export type UpdateSettingEmailDTO = {
  name?: string | null;
  unit_id?: string | null;
  subject?: string | null;
  body?: string | null;
  auto_send?: boolean;
  is_active?: boolean;
};

export type UpdateSettingEmailResponse = ISettingEmail;

const updateSettingEmail = async (
  id: string,
  data: UpdateSettingEmailDTO,
): Promise<UpdateSettingEmailResponse> => {
  const res = await apiClient.put(`${URL_API_SEND_EMAIL}/${id}`, data);
  return res.data?.data ?? res.data;
};

type UpdateSettingEmailMutationOptions = Omit<
  UseMutationOptions<
    UpdateSettingEmailResponse,
    Error,
    { id: string; data: UpdateSettingEmailDTO }
  >,
  "onSuccess"
> & {
  onSuccess?: (
    data: UpdateSettingEmailResponse,
    variables: { id: string; data: UpdateSettingEmailDTO },
    context: unknown,
  ) => void;
};

export const useUpdateSettingEmail = (config?: UpdateSettingEmailMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateSettingEmail(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["setting-email"] });
      config?.onSuccess?.(data, variables, context);
    },
    ...config,
  });
};
