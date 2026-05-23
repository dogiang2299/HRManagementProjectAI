import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_RECRUITEMENT_INFOR } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { DashboardCostData, DashboardPeriod, DashboardScope } from "../types";

export type DashboardCostParams = {
  period: DashboardPeriod;
  scope: DashboardScope;
  companyId?: string;
};

export const getDashboardCost = async (
  params: DashboardCostParams,
): Promise<DashboardCostData> => {
  const res = await apiClient.get(`${URL_API_RECRUITEMENT_INFOR}/cost/summary`, {
    params,
  });

  return res.data as DashboardCostData;
};

export const useDashboardCost = (
  params: DashboardCostParams,
  config?: Omit<
    UseQueryOptions<DashboardCostData, Error, DashboardCostData, ["dashboard-cost", DashboardCostParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dashboard-cost", params],
    queryFn: () => getDashboardCost(params),
    staleTime: 60 * 1000,
    ...config,
  });
};
