import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POSITION_POST } from "../../../../../constant/config";
import type { IPositionPost } from "../types";

export type GetPositionPostsParams = {
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

export type GetPositionPostsResponse = {
  data: IPositionPost[];
  pagination: Pagination;
};

export const getAllPositionPosts = async (
  params: GetPositionPostsParams,
): Promise<GetPositionPostsResponse> => {
  const res = await apiClient.get(URL_API_POSITION_POST, { params });
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

export const useGetPositionPosts = (
  params: GetPositionPostsParams,
  config?: Omit<
    UseQueryOptions<GetPositionPostsResponse, Error, GetPositionPostsResponse, [string, GetPositionPostsParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["position-post", params],
    queryFn: () => getAllPositionPosts(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};
