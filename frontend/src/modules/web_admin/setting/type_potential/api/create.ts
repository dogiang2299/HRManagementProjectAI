import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POTCAN } from "../../../../../constant/config";
import type { MutationConfig } from "../../../../../lib/react-query";
import type { ITypePotential } from "../types";

export type CreateTypePotentialDTO = {
  name: string;
  description?: string | null;
  is_active?: boolean;
  unit_id?: string | null;
};

export const createTypePotential = async (data: CreateTypePotentialDTO): Promise<ITypePotential> => {
  const res = await apiClient.post(URL_API_POTCAN, data);
  return res.data?.data ?? res.data;
};

type UseCreateTypePotentialOptions = {
  config?: MutationConfig<typeof createTypePotential>;
};

export const useCreateTypePotential = ({ config }: UseCreateTypePotentialOptions = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTypePotential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["type-potential"] });
    },
    ...config,
  });
};
