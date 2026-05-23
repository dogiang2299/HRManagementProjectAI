import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_CANDIDATE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { ICandidate } from "../../candidate/types";

export type PotentialCandidateParams = {
  pages?: number;
  limit?: number;
  search?: string;
  potential_type_id?: string;
};

export type PotentialCandidateResponse = {
  data: ICandidate[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};

export const getPotentialCandidates = async (
  params: PotentialCandidateParams,
): Promise<PotentialCandidateResponse> => {
  const res = await apiClient.get(`${URL_API_CANDIDATE}/potential`, {
    params: {
      pages: params.pages,
      items_per_pages: params.limit,
      search: params.search,
      potential_type_id: params.potential_type_id,
    },
  });

  const payload = res.data?.data ?? res.data;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const meta = Array.isArray(payload) ? res.data : payload;

  const totalItems = Number(meta?.total_items ?? list.length ?? 0);
  const currentPage = Number(meta?.current_pages ?? params.pages ?? 1);
  const limit = Number(meta?.items_per_pages ?? params.limit ?? 10);
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(limit, 1)));

  return {
    data: list,
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      limit,
    },
  };
};

export const useGetPotentialCandidates = (
  params: PotentialCandidateParams,
  config?: Omit<
    UseQueryOptions<PotentialCandidateResponse, Error, PotentialCandidateResponse, ["potential-candidates", PotentialCandidateParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["potential-candidates", params],
    queryFn: () => getPotentialCandidates(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};
