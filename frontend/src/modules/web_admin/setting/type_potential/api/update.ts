import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POTCAN } from "../../../../../constant/config";
import type { ITypePotential } from "../types";

export type UpdateTypePotentialDTO = {
  name?: string;
  description?: string | null;
  is_active?: boolean;
  unit_id?: string | null;
};

const updateTypePotential = async (
  id: string,
  data: UpdateTypePotentialDTO,
): Promise<ITypePotential> => {
  const res = await apiClient.put(`${URL_API_POTCAN}/${id}`, data);
  return res.data?.data ?? res.data;
};

type UpdateTypePotentialMutationOptions = Omit<
  UseMutationOptions<ITypePotential, Error, { id: string; data: UpdateTypePotentialDTO }>,
  "onSuccess"
> & {
  onSuccess?: (
    data: ITypePotential,
    variables: { id: string; data: UpdateTypePotentialDTO },
    context: unknown,
  ) => void;
};

export const useUpdateTypePotential = (config?: UpdateTypePotentialMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTypePotential(id, data),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ["type-potential"] });
      config?.onSuccess?.(data, variables, context);
    },
    ...config,
  });
};
