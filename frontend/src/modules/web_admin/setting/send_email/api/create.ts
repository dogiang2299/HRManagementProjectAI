import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_SEND_EMAIL } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { ISettingEmail } from "../types";

export type CreateSettingEmailDTO = {
  name: string;
  unit_id?: string | null;
  subject: string;
  body: string;
  auto_send?: boolean;
  is_active?: boolean;
};

export const createSettingEmail = async (
  data: CreateSettingEmailDTO,
): Promise<ISettingEmail> => {
  const res = await apiClient.post(URL_API_SEND_EMAIL, data);
  return res.data?.data ?? res.data;
};

type UseCreateSettingEmailOptions = {
  config?: MutationConfig<typeof createSettingEmail>;
};

export const useCreateSettingEmail = ({ config }: UseCreateSettingEmailOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSettingEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["setting-email"] });
    },
    ...config,
  });
};
