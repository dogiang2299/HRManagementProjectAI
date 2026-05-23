import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_RANK } from "../../../../../constant/config";
import type { IRank } from "../types";

export type GetRanksParams = {
  pages?: number;
  items_per_pages?: number;
  search?: string;
  unit_id?: string;
};

export type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

export type GetRanksResponse = {
  data: IRank[];
  pagination: Pagination;
};

export const getAllRanks = async (
  params: GetRanksParams,
): Promise<GetRanksResponse> => {
  const res = await apiClient.get(URL_API_RANK, { params });
  const raw =
    res.data?.data && !Array.isArray(res.data.data)
      ? res.data.data
      : res.data;
  const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

  const totalItems = raw?.total_items ?? list.length ?? 0;
  const currentPage = raw?.current_pages ?? params.pages ?? 1;
  const limit = raw?.items_per_pages ?? params.items_per_pages ?? 10;
  const totalPages = raw?.total_pages ?? Math.ceil(totalItems / limit);

  return {
    data: list,
    pagination: { totalItems, totalPages, currentPage, limit },
  };
};

export const useGetRanks = (
  params: GetRanksParams,
  config?: Omit<
    UseQueryOptions<GetRanksResponse, Error, GetRanksResponse, [string, GetRanksParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["rank", params],
    queryFn: () => getAllRanks(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};
