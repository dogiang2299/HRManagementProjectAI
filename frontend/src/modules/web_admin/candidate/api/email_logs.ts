import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";

export type EmailLog = {
  id: string;
  template_id: string | null;
  to_email: string;
  subject: string | null;
  body: string | null;
  status: string | null; // 'sent' | 'failed'
  error_message: string | null;
  sent_by: string | null;
  created_at: string;
};

export type GetEmailLogsParams = {
  page?: number;
  limit?: number;
  applicationId?: string;
  recruitmentInforId?: string;
};

export type GetEmailLogsResponse = {
  data: EmailLog[];
  current_page: number;
  items_per_page: number;
  total_items: number;
};

export const getEmailLogs = async (
  candidateId: string,
  params: GetEmailLogsParams = {},
): Promise<GetEmailLogsResponse> => {
  const res = await apiClient.get(`candidate-email/${candidateId}/logs`, {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 10,
    },
  });

  const payload = res.data?.data ?? res.data;
  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];

  return {
    data: list,
    current_page: Number(payload?.current_page ?? payload?.current_pages ?? 1),
    items_per_page: Number(payload?.items_per_page ?? payload?.items_per_pages ?? params.limit ?? 10),
    total_items: Number(payload?.total_items ?? list.length),
  };
};

export const useEmailLogs = (
  candidateId: string,
  params: GetEmailLogsParams = {},
  config?: Omit<
    UseQueryOptions<
      GetEmailLogsResponse,
      Error,
      GetEmailLogsResponse,
      [string, string, GetEmailLogsParams]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["email-logs", candidateId, params],
    enabled: !!candidateId,
    queryFn: () => getEmailLogs(candidateId, params),
    ...config,
  });
};
