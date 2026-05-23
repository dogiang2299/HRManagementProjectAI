import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_SEND_EMAIL } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { ISettingEmail } from "../types";

export const deleteSettingEmail = async (id: string): Promise<ISettingEmail> => {
  const res = await apiClient.delete(`${URL_API_SEND_EMAIL}/${id}`);
  return res.data?.data ?? res.data;
};

type UseDeleteSettingEmailOptions = {
  config?: MutationConfig<typeof deleteSettingEmail>;
};

export const useDeleteSettingEmail = ({ config }: UseDeleteSettingEmailOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: deleteSettingEmail,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["setting-email"] });
      queryClient.removeQueries({ queryKey: ["setting-email", id] });
      onSuccess?.(data, id, onMutateResult, context);
    },
  });
};
