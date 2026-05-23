import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POTCAN } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { ITypePotential } from "../types";

export const deleteTypePotential = async (id: string): Promise<ITypePotential> => {
  const res = await apiClient.delete(`${URL_API_POTCAN}/${id}`);
  return res.data?.data ?? res.data;
};

type UseDeleteTypePotentialOptions = {
  config?: MutationConfig<typeof deleteTypePotential>;
};

export const useDeleteTypePotential = ({ config }: UseDeleteTypePotentialOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: deleteTypePotential,
    onSuccess: (data, id, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["type-potential"] });
      queryClient.removeQueries({ queryKey: ["type-potential", id] });
      onSuccess?.(data, id, onMutateResult, context);
    },
  });
};
