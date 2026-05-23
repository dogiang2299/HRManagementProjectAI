import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { getDashboardOverview } from './get_overview';
import type { DashboardOverviewParams, DashboardOverviewResponse } from './get_overview';

export const useDashboardOverview = (
  params: DashboardOverviewParams,
  config?: Omit<
    UseQueryOptions<DashboardOverviewResponse, Error, DashboardOverviewResponse, [string, DashboardOverviewParams]>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: ['dashboard-overview', params],
    queryFn: () => getDashboardOverview(params),
    ...config,
  });
};
