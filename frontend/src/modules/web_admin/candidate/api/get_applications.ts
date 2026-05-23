import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import apiClient from '../../../../lib/api';
import { URL_API_CANDIDATE } from '../../../../constant/config';
import type { IApplycation } from '../types';

export type CandidateApplicationsResponse = {
  candidate_id: string;
  total: number;
  company_count: number;
  applications: IApplycation[];
};

export const getCandidateApplications = async (candidateId: string): Promise<CandidateApplicationsResponse> => {
  const res = await apiClient.get(`${URL_API_CANDIDATE}/${candidateId}/applications`);
  const payload = res.data?.data ?? res.data ?? res;
  return payload as CandidateApplicationsResponse;
};

export const useGetCandidateApplications = (
  candidateId: string,
  config?: Omit<UseQueryOptions<CandidateApplicationsResponse, Error, CandidateApplicationsResponse, [string, string, string]>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery({
    queryKey: ['candidate', candidateId, 'applications'],
    enabled: !!candidateId,
    queryFn: () => getCandidateApplications(candidateId),
    ...config,
  });
};
