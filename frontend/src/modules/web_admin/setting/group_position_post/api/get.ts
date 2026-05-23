import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_POSITION_GROUP } from "../../../../../constant/config";
import type { IGroupPositionPost } from "../types";

export type GetGroupPositionPostsParams = {
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

export type GetGroupPositionPostsResponse = {
  data: IGroupPositionPost[];
  pagination: Pagination;
};

export const getAllGroupPositionPosts = async (
  params: GetGroupPositionPostsParams,
): Promise<GetGroupPositionPostsResponse> => {
  const res = await apiClient.get(URL_API_POSITION_GROUP, { params });
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

export const useGetGroupPositionPosts = (
  params: GetGroupPositionPostsParams,
  config?: Omit<
    UseQueryOptions<
      GetGroupPositionPostsResponse,
      Error,
      GetGroupPositionPostsResponse,
      [string, GetGroupPositionPostsParams]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["position-group", params],
    queryFn: () => getAllGroupPositionPosts(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};
