import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_COMPANY_SKILLS, URL_API_SKILLS } from "../../../../../constant/config";
import type { ISkill } from "../types";

export type GetSkillsParams = {
  pages?: number;
  items_per_pages?: number;
  search?: string;
  unit_id?: string;
};

export type Pagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

export type GetSkillsResponse = {
  data: ISkill[];
  pagination: Pagination;
};

export const getAllSkills = async (
  params: GetSkillsParams,
): Promise<GetSkillsResponse> => {
  const res = await apiClient.get(URL_API_SKILLS, { params });
  const raw =
    res.data?.data && !Array.isArray(res.data.data)
      ? res.data.data
      : res.data;
  const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

  const totalItems = raw?.total_items ?? list.length ?? 0;
  const currentPage = raw?.current_pages ?? params.pages ?? 1;
  const limit = raw?.items_per_pages ?? params.items_per_pages ?? 10;
  const totalPages = raw?.total_pages ?? Math.ceil(totalItems / limit);

  return {
    data: list,
    pagination: { totalItems, totalPages, currentPage, limit },
  };
};

export const useGetSkills = (
  params: GetSkillsParams,
  config?: Omit<
    UseQueryOptions<GetSkillsResponse, Error, GetSkillsResponse, [string, GetSkillsParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["skills", params],
    queryFn: () => getAllSkills(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};

type CompanySkillRecord = {
  id: string;
  company_id: string;
  skill_id: string;
  is_active: boolean;
  source?: string | null;
  note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  skill?: ISkill | null;
};

const unwrapArray = (data: any) => {
  const raw =
    data?.data && !Array.isArray(data.data)
      ? data.data
      : data;
  return Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
};

const toCompanySkill = (record: CompanySkillRecord): ISkill | null => {
  if (!record?.skill) return null;

  return {
    ...record.skill,
    id: record.skill.id || record.skill_id,
    is_active: record.skill.is_active ?? record.is_active,
    created_at: record.created_at ?? record.skill.created_at,
    updated_at: record.updated_at ?? record.skill.updated_at,
  };
};

export const getCompanySkills = async (keyword?: string): Promise<ISkill[]> => {
  const searchText = keyword?.trim() || "";
  const endpoint = searchText
    ? `${URL_API_COMPANY_SKILLS}/search`
    : URL_API_COMPANY_SKILLS;
  const res = await apiClient.get(endpoint, {
    params: searchText ? { keyword: searchText } : undefined,
  });

  return unwrapArray(res.data)
    .map((item: CompanySkillRecord) => toCompanySkill(item))
    .filter(Boolean) as ISkill[];
};

export const useGetCompanySkills = (
  keyword?: string,
  config?: Omit<
    UseQueryOptions<ISkill[], Error, ISkill[], [string, string]>,
    "queryKey" | "queryFn"
  >,
) => {
  const searchText = keyword?.trim() || "";

  return useQuery({
    queryKey: ["company-skills", searchText],
    queryFn: () => getCompanySkills(searchText),
    placeholderData: keepPreviousData,
    ...config,
  });
};

export const globalSearchSkills = async (
  keyword?: string,
  limit = 20,
): Promise<ISkill[]> => {
  const searchText = keyword?.trim() || "";
  if (!searchText) return [];

  const res = await apiClient.get(`${URL_API_SKILLS}/global-search`, {
    params: { keyword: searchText, limit },
  });

  return unwrapArray(res.data);
};

export const useGlobalSearchSkills = (
  keyword?: string,
  limit = 20,
  config?: Omit<
    UseQueryOptions<ISkill[], Error, ISkill[], [string, string, string, number]>,
    "queryKey" | "queryFn"
  >,
) => {
  const searchText = keyword?.trim() || "";

  return useQuery({
    queryKey: ["skills", "global-search", searchText, limit],
    queryFn: () => globalSearchSkills(searchText, limit),
    enabled: Boolean(searchText),
    placeholderData: keepPreviousData,
    ...config,
  });
};
