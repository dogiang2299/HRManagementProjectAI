import apiClient from '../../../../lib/api';
import type { DashboardPeriod, DashboardScope } from '../types';

export type DashboardOverviewParams = {
  companyId?: string;
  period?: DashboardPeriod;
  scope?: DashboardScope;
};

export type DashboardOverviewResponse = {
  period: DashboardPeriod;
  scope: DashboardScope;
  companyId: string | null;
  activeCampaigns: number;
  totalRecruitments: number;
  totalApplications: number;
  acceptedCandidates: number;
  generatedAt: string;
};

export const getDashboardOverview = async (
  params: DashboardOverviewParams,
): Promise<DashboardOverviewResponse> => {
  const res = await apiClient.get('/dashboard/overview', { params });
  return res.data;
};
