import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import publicApiClient from "../../../../lib/public-api";
import type { IRole } from "../type";

export type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

export type GetRoleParams = {
  pages?: number;
  limit?: number;
  search?: string;
  status?: string;
};

export type GetRoleResponse = {
  data: IRole[];
  pagination: Pagination;
};

export const getAllRole = async (params: GetRoleParams): Promise<GetRoleResponse> => {
  const res = await publicApiClient.get("/role", {
    params: {
      pages: params.pages,
      items_per_pages: params.limit, // IMPORTANT: keep backend parameter name
      search: params.search,
      status: params.status,
    },
  });

  const raw = res.data;
  const payload = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
  const sourceList = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  const list = sourceList.map((item: IRole) => {
    return {
      ...item,
    };
  });

  const totalItems = Number(payload?.total_items ?? raw?.total_items ?? 0);
  const currentPage = Number(payload?.current_pages ?? raw?.current_pages ?? params.pages ?? 1);
  const limit = Number(payload?.items_per_pages ?? raw?.items_per_pages ?? params.limit ?? 10);
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;

  return {
    data: list,
    pagination: { totalItems, totalPages, currentPage, limit },
  };
};
export const useGetRole = (
    params: GetRoleParams,
    config?: Omit<
    UseQueryOptions<GetRoleResponse, Error, GetRoleResponse, [string, GetRoleParams]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ['role', params],
        queryFn: () => getAllRole(params),
        placeholderData: keepPreviousData,
        ...config
    })
}
