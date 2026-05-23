import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ICandidateAuditLog } from "../types";
import apiClient from "../../../../lib/api";

export type GetCandidateAuditLogParams = {
  page?: number;
  limit?: number;
  applicationId?: string;
};

export type GetCandidateAuditLogResponse = {
  data: ICandidateAuditLog[];
  current_pages: number;
  items_per_pages: number;
  total_items: number;
};

export const getCandidateAuditLogs = async (
  candidateId: string,
  params: GetCandidateAuditLogParams = {},
): Promise<GetCandidateAuditLogResponse> => {
  const res = await apiClient.get(`candidate/${candidateId}/audit-logs`, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 100,
    },
  });

  const payload = res.data?.data ?? res.data;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  const pageInfo = Array.isArray(payload) ? res.data : payload;

  return {
    data: list,
    current_pages: Number(pageInfo?.current_pages ?? 1),
    items_per_pages: Number(pageInfo?.items_per_pages ?? params.limit ?? 100),
    total_items: Number(pageInfo?.total_items ?? list.length ?? 0),
  };
};

export const useCandidateAuditLogs = (
  candidateId: string,
  params: GetCandidateAuditLogParams = {},
  config?: Omit<
    UseQueryOptions<
      GetCandidateAuditLogResponse,
      Error,
      GetCandidateAuditLogResponse,
      [string, string, GetCandidateAuditLogParams]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["candidate-audit-logs", candidateId, params],
    enabled: !!candidateId,
    queryFn: () => getCandidateAuditLogs(candidateId, params),
    ...config,
  });
};
