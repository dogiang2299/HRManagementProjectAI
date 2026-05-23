import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";

export type CompanyFollowSummary = {
  company_id: string;
  is_following: boolean;
  follower_count?: number;
};

export type CompanyFollowActionResponse = {
  message: string;
  is_following: boolean;
  follower_count: number;
  company_id: string;
};

export const followCompany = async (
  companyId: string,
): Promise<CompanyFollowActionResponse> => {
  const res = await apiClient.post(`/company-follow/${companyId}`, {});

  return res.data?.data ?? res.data;
};

export const unfollowCompany = async (
  companyId: string,
): Promise<CompanyFollowActionResponse> => {
  const res = await apiClient.delete(`/company-follow/${companyId}`);

  return res.data?.data ?? res.data;
};

export const getCompanyFollowSummary = async (
  companyId: string,
): Promise<CompanyFollowSummary> => {
  const res = await apiClient.get(`/company-follow/${companyId}/summary`);

  return res.data?.data ?? res.data;
};

export const useCompanyFollowSummary = (
  companyId: string,
  config?: Omit<UseQueryOptions<CompanyFollowSummary, Error>, "queryKey" | "queryFn">,
) => {
  return useQuery({
    queryKey: ["company-follow-summary", companyId],
    queryFn: () => getCompanyFollowSummary(companyId),
    enabled: Boolean(companyId),
    ...config,
  });
};

export const useFollowCompanyMutation = (
  config?: Omit<UseMutationOptions<CompanyFollowActionResponse, Error, string>, "mutationFn">,
) => {
  return useMutation({
    mutationFn: (companyId: string) => followCompany(companyId),
    ...config,
  });
};

export const useUnfollowCompanyMutation = (
  config?: Omit<UseMutationOptions<CompanyFollowActionResponse, Error, string>, "mutationFn">,
) => {
  return useMutation({
    mutationFn: (companyId: string) => unfollowCompany(companyId),
    ...config,
  });
};