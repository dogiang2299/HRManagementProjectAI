import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_RECRUITEMENT_INFOR } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { DashboardPeriod, DashboardPlanData, DashboardScope } from "../types";

export type DashboardPlanParams = {
  period: DashboardPeriod;
  scope: DashboardScope;
  companyId?: string;
};

export const getDashboardPlan = async (
  params: DashboardPlanParams,
): Promise<DashboardPlanData> => {
  const res = await apiClient.get(`${URL_API_RECRUITEMENT_INFOR}/plan/summary`, {
    params,
  });

  return res.data as DashboardPlanData;
};

export const useDashboardPlan = (
  params: DashboardPlanParams,
  config?: Omit<
    UseQueryOptions<DashboardPlanData, Error, DashboardPlanData, ["dashboard-plan", DashboardPlanParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["dashboard-plan", params],
    queryFn: () => getDashboardPlan(params),
    staleTime: 60 * 1000,
    ...config,
  });
};

