import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../../lib/api";
import { URL_API_COMPANY_SKILLS, URL_API_SKILLS } from "../../../../../constant/config";
import type {
  ISkill,
  SkillTaxonomyOptions,
  SkillTaxonomyTreeResponse,
  TaxonomySkill,
} from "../types";

export type GetSkillsParams = {
  pages?: number;
  items_per_pages?: number;
  search?: string;
  unit_id?: string;
  scope?: string;
  taxonomy_subgroup_node_id?: string;
  taxonomy_group_node_id?: string;
  missing_taxonomy_node?: boolean;
  include_inactive?: boolean;
};

export type TaxonomySummaryResponse = {
  totalSkills: number;
  mappedSkillCount: number;
  missingSkillCount: number;
};

export const mapSkillRecordToTaxonomy = (skill: any): TaxonomySkill => {
  const mapping = skill?.taxonomyMappings?.[0];
  const aliases = Array.isArray(skill?.aliases)
    ? skill.aliases.map((item: { alias_text?: string }) => item.alias_text).filter(Boolean)
    : [];

  return {
    id: skill.id,
    name: skill.name,
    description: skill.description ?? null,
    parent_id: skill.parent_id ?? null,
    unit_id: skill.unit_id ?? null,
    is_active: Boolean(skill.is_active),
    created_at: skill.created_at,
    updated_at: skill.updated_at,
    aliases,
    taxonomy_group: mapping?.taxonomy_group ?? null,
    taxonomy_subgroup: mapping?.taxonomy_subgroup ?? null,
    taxonomy_group_node_id: mapping?.taxonomy_group_node_id ?? null,
    taxonomy_subgroup_node_id: mapping?.taxonomy_subgroup_node_id ?? null,
    taxonomyMappings: skill.taxonomyMappings ?? [],
    scope: skill.scope ?? null,
    source: skill.source ?? null,
  };
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
  const res = await apiClient.get(URL_API_SKILLS, {
    params: {
      pages: params.pages ?? 1,
      items_per_pages: params.items_per_pages ?? 10,
      search: params.search?.trim() || undefined,
      unit_id: params.unit_id,
      scope: params.scope,
      taxonomy_subgroup_node_id: params.taxonomy_subgroup_node_id,
      taxonomy_group_node_id: params.taxonomy_group_node_id,
      missing_taxonomy_node: params.missing_taxonomy_node ? "true" : undefined,
      include_inactive: params.include_inactive ? "true" : undefined,
    },
  });
  const raw =
    res.data?.data && !Array.isArray(res.data.data)
      ? res.data.data
      : res.data;
  const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

  const totalItems = raw?.total_items ?? list.length ?? 0;
  const currentPage = raw?.current_pages ?? params.pages ?? 1;
  const limit = raw?.items_per_pages ?? params.items_per_pages ?? 10;
  const totalPages = raw?.total_pages ?? Math.max(1, Math.ceil(totalItems / limit));

  return {
    data: list,
    pagination: { totalItems, totalPages, currentPage, limit },
  };
};

export const getTaxonomyNodeSummary = async (): Promise<TaxonomySummaryResponse> => {
  const res = await apiClient.get(`${URL_API_SKILLS}/taxonomy-nodes/summary`);
  return {
    totalSkills: Number(res.data?.totalSkills ?? 0),
    mappedSkillCount: Number(res.data?.mappedSkillCount ?? 0),
    missingSkillCount: Number(res.data?.missingSkillCount ?? 0),
  };
};

export const useGetTaxonomyNodeSummary = (
  config?: Omit<
    UseQueryOptions<TaxonomySummaryResponse, Error>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["skills", "taxonomy-summary"],
    queryFn: getTaxonomyNodeSummary,
    staleTime: 60_000,
    ...config,
  });
};

type SkillsListQueryKey = ["skills", "list", GetSkillsParams];

export const useGetSkills = (
  params: GetSkillsParams,
  config?: Omit<
    UseQueryOptions<GetSkillsResponse, Error, GetSkillsResponse, SkillsListQueryKey>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["skills", "list", params] satisfies SkillsListQueryKey,
    queryFn: () => getAllSkills(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};

export type GetSkillTaxonomyTreeParams = {
  search?: string;
  missing_only?: boolean;
};

export const getSkillTaxonomyTree = async (
  params: GetSkillTaxonomyTreeParams = {},
): Promise<SkillTaxonomyTreeResponse> => {
  const res = await apiClient.get(`${URL_API_SKILLS}/taxonomy-nodes/tree`, {
    params: {
      search: params.search?.trim() || undefined,
      missing_only: params.missing_only ? "true" : undefined,
    },
  });

  return {
    totalSkills: Number(res.data?.totalSkills ?? 0),
    mappedSkillCount: Number(res.data?.mappedSkillCount ?? 0),
    missingSkillCount: Number(res.data?.missingSkillCount ?? 0),
    groups: Array.isArray(res.data?.groups) ? res.data.groups : [],
  };
};

export const useGetSkillTaxonomyTree = (
  params: GetSkillTaxonomyTreeParams = {},
  config?: Omit<
    UseQueryOptions<
      SkillTaxonomyTreeResponse,
      Error,
      SkillTaxonomyTreeResponse,
      [string, string, GetSkillTaxonomyTreeParams]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["skills", "taxonomy-tree", params],
    queryFn: () => getSkillTaxonomyTree(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};

export const getSkillTaxonomyOptions = async (): Promise<SkillTaxonomyOptions> => {
  const res = await apiClient.get(`${URL_API_SKILLS}/taxonomy-nodes/options`);

  return {
    groups: Array.isArray(res.data?.groups) ? res.data.groups : [],
    subgroups: Array.isArray(res.data?.subgroups) ? res.data.subgroups : [],
    subgroupsByGroup:
      res.data?.subgroupsByGroup && typeof res.data.subgroupsByGroup === "object"
        ? res.data.subgroupsByGroup
        : {},
  };
};

export const useGetSkillTaxonomyOptions = (
  config?: Omit<
    UseQueryOptions<
      SkillTaxonomyOptions,
      Error,
      SkillTaxonomyOptions,
      [string, string]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["skills", "taxonomy-options"],
    queryFn: getSkillTaxonomyOptions,
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

export const searchSkills = async (keyword?: string, limit = 20): Promise<any[]> => {
  const searchText = keyword?.trim() || "";
  if (!searchText) return [];

  const res = await apiClient.get(`${URL_API_SKILLS}/search`, {
    params: { keyword: searchText, limit },
  });

  const raw = res.data?.data ?? res.data;
  return Array.isArray(raw) ? raw : [];
};

export const useSearchSkills = (
  keyword?: string,
  limit = 20,
  config?: Omit<
    UseQueryOptions<any[], Error, any[], [string, string, string, number]>,
    "queryKey" | "queryFn"
  >,
) => {
  const searchText = keyword?.trim() || "";
  return useQuery({
    queryKey: ["skills", "search", searchText, limit],
    queryFn: () => searchSkills(searchText, limit),
    enabled: Boolean(searchText),
    placeholderData: keepPreviousData,
    ...config,
  });
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
