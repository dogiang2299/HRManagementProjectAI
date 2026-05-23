import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_POTCAN } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

export type PotentialTypeItem = {
  id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export type PotentialTypeResponse = {
  data: PotentialTypeItem[];
  current_pages: number;
  items_per_pages: number;
  total_items: number;
};

export const getPotentialTypes = async (): Promise<PotentialTypeResponse> => {
  const res = await apiClient.get(URL_API_POTCAN, {
    params: {
      pages: 1,
      items_per_pages: 200,
    },
  });

  const payload = res.data?.data ?? res.data;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const meta = Array.isArray(payload) ? res.data : payload;

  return {
    data: list,
    current_pages: Number(meta?.current_pages ?? 1),
    items_per_pages: Number(meta?.items_per_pages ?? 200),
    total_items: Number(meta?.total_items ?? list.length ?? 0),
  };
};

export const usePotentialTypes = (
  config?: Omit<
    UseQueryOptions<PotentialTypeResponse, Error, PotentialTypeResponse, ["potential-types"]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["potential-types"],
    queryFn: getPotentialTypes,
    ...config,
  });
};
