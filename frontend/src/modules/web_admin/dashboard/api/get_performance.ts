import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_APPLICATION } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { DashboardPerformanceData, DashboardPeriod, DashboardScope } from "../types";

export type DashboardPerformanceParams = {
  period: DashboardPeriod;
  scope: DashboardScope;
  companyId?: string;
};

export const getDashboardPerformance = async (
  params: DashboardPerformanceParams,
): Promise<DashboardPerformanceData> => {
  const res = await apiClient.get(`${URL_API_APPLICATION}/performance/summary`, {
    params,
  });

  return res.data as DashboardPerformanceData;
};

export const useDashboardPerformance = (
  params: DashboardPerformanceParams,
  config?: Omit<
    UseQueryOptions<DashboardPerformanceData, Error, DashboardPerformanceData, ["dashboard-performance", DashboardPerformanceParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dashboard-performance", params],
    queryFn: () => getDashboardPerformance(params),
    staleTime: 60 * 1000,
    ...config,
  });
};
