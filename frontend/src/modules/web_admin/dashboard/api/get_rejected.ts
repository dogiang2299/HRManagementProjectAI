import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_APPLICATION } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { DashboardPeriod, DashboardRejectedData, DashboardScope } from "../types";

export type DashboardRejectedParams = {
  period: DashboardPeriod;
  scope: DashboardScope;
  companyId?: string;
};

export const getDashboardRejected = async (
  params: DashboardRejectedParams,
): Promise<DashboardRejectedData> => {
  const res = await apiClient.get(`${URL_API_APPLICATION}/rejected/summary`, {
    params,
  });

  return res.data as DashboardRejectedData;
};

export const useDashboardRejected = (
  params: DashboardRejectedParams,
  config?: Omit<
    UseQueryOptions<DashboardRejectedData, Error, DashboardRejectedData, ["dashboard-rejected", DashboardRejectedParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dashboard-rejected", params],
    queryFn: () => getDashboardRejected(params),
    staleTime: 60 * 1000,
    ...config,
  });
};
