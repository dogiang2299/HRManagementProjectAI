import { useQuery, keepPreviousData, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_ROLE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { IRole } from "../types";

export type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

export type GetRoleParams = {
  page?: number;
  pages?: number;
  limit?: number;
  items_per_page?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
};

export type GetRoleResponse = {
  data: IRole[];
  pagination: Pagination;
};

export const getAllRole = async (params: GetRoleParams): Promise<GetRoleResponse> => {
  const currentPage = params.page ?? params.pages;
  const perPage = params.items_per_page ?? params.limit;
  const queryParams = {
    page: currentPage,
    items_per_page: perPage,
    search: params.search,
    status: params.status,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };

  const res = await apiClient.get(URL_API_ROLE, { params: queryParams });

  const raw =
    res.data?.data && !Array.isArray(res.data.data)
      ? res.data.data
      : res.data;

  // list: backend có thể trả { data: [...] } hoặc trả thẳng [...]
  const list: IRole[] =
    Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

  const totalItems = raw?.total_items ?? list.length ?? 0;
  const resolvedCurrentPage = raw?.current_page ?? raw?.current_pages ?? currentPage ?? 1;
  const limit = raw?.items_per_page ?? raw?.total_per_page ?? perPage ?? 10;
  const totalPages = raw?.total_pages ?? Math.ceil(totalItems / limit);

  return {
    data: list,
    pagination: { totalItems, totalPages, currentPage: resolvedCurrentPage, limit },
  };
};

export const useGetRoles = (
  params: GetRoleParams = { page: 1, limit: 100 },
  config?: Omit<
    UseQueryOptions<GetRoleResponse, Error, GetRoleResponse, [string, GetRoleParams]>,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => getAllRole(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};