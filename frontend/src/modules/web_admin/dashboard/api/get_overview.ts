import apiClient from '../../../../lib/api';

export type DashboardOverviewParams = {
  companyId?: string;
};

export type DashboardOverviewResponse = {
  totalRecruitments: number;
  totalApplications: number;
  // ...bổ sung các trường khác nếu backend trả về
};

export const getDashboardOverview = async (params: DashboardOverviewParams): Promise<DashboardOverviewResponse> => {
  const res = await apiClient.get('/dashboard/overview', { params });
  return res.data;
};
