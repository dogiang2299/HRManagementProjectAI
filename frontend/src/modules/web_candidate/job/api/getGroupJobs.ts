import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import publicApiClient from "../../../../lib/public-api";
import type { GetGroupJobsParams, GetGroupJobsResponse, IGroupJob } from "../types/job";

export const getAllGroupJobs = async (params: GetGroupJobsParams) => {
  const res = await publicApiClient.get("/position-group", {
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

  const list = sourceList.map((item: IGroupJob) => {

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
export const useGetJobs = (
    params: GetGroupJobsParams,
    config?: Omit<
    UseQueryOptions<GetGroupJobsResponse, Error, GetGroupJobsResponse, [string, GetGroupJobsParams]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ['position-group', params],
        queryFn: () => getAllGroupJobs(params),
        placeholderData: keepPreviousData,
        ...config
    })
}