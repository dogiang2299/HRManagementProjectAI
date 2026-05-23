import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_SEND_EMAIL } from "../../../../../constant/config";
import type { ISettingEmail } from "../types";

export type GetSettingEmailsParams = {
  pages?: number;
  items_per_pages?: number;
  search?: string;
};

export type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

export type GetSettingEmailsResponse = {
  data: ISettingEmail[];
  pagination: Pagination;
};

export const getAllSettingEmails = async (
  params: GetSettingEmailsParams,
): Promise<GetSettingEmailsResponse> => {
  const res = await apiClient.get(URL_API_SEND_EMAIL, { params });
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

export const useGetSettingEmails = (
  params: GetSettingEmailsParams,
  config?: Omit<
    UseQueryOptions<
      GetSettingEmailsResponse,
      Error,
      GetSettingEmailsResponse,
      [string, GetSettingEmailsParams]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["setting-email", params],
    queryFn: () => getAllSettingEmails(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};
