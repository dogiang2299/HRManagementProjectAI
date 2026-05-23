import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POTCAN } from "../../../../../constant/config";
import type { ITypePotential } from "../types";

export type GetTypePotentialParams = {
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

export type GetTypePotentialResponse = {
  data: ITypePotential[];
  pagination: Pagination;
};

export const getAllTypePotential = async (
  params: GetTypePotentialParams,
): Promise<GetTypePotentialResponse> => {
  const res = await apiClient.get(URL_API_POTCAN, { params });
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

export const useGetTypePotential = (
  params: GetTypePotentialParams,
  config?: Omit<
    UseQueryOptions<GetTypePotentialResponse, Error, GetTypePotentialResponse, [string, GetTypePotentialParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["type-potential", params],
    queryFn: () => getAllTypePotential(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};
