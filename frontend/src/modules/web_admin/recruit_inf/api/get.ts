import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { IRecruitmentInfor } from "../types";
import { buildRecruitmentActivities } from "../utils";
import  { URL_API_RECRUITEMENT_INFOR } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

const normalizeRecruitmentStatus = (status?: string | null) => {
  if (!status) return status;

  const normalized = status.trim().toUpperCase().replace(/\s+/g, "_").replace(/-+/g, "_");
  if (normalized === "DRAFT") return "DRAFT";
  if (normalized === "PUBLIC") return "PUBLIC";
  if (normalized === "INTERNAL") return "INTERNAL";
  if (normalized === "CLOSED") return "CLOSED";
  if (normalized === "STOP_RECEIVING") return "STOP_RECEIVING";
  return normalized;
};

export type IRecInformData = IRecruitmentInfor;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number
}

export type GetRecInfromParams = {
    pages?: number;
    limit?: number;
    search?: string;
    status?: string;
  department_id?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
}

export type GetRecInformResponse = {
    data: IRecruitmentInfor[];
    pagination: Pagination
}

export const getAllRecInform = async (params: GetRecInfromParams) => {
  const res = await apiClient.get(URL_API_RECRUITEMENT_INFOR, {
    params: {
      pages: params.pages,
      items_per_pages: params.limit, // IMPORTANT: keep backend parameter name
      search: params.search,
      status: params.status,
      department_id: params.department_id,
    },
  });

  const raw = res.data;
  const payload = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
  const sourceList = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  const list = sourceList.map((item: IRecruitmentInfor) => {
    const departmentName = item.department_name ?? item.department?.full_name ?? null;
    const workLocationName = item.work_location_name ?? item.workLocation?.full_name ?? null;

    return {
      ...item,
      status: normalizeRecruitmentStatus(item.status) as IRecruitmentInfor["status"],
      department_name: departmentName,
      work_location_name: workLocationName,
      activities: buildRecruitmentActivities(item),
    };
  });

  const totalItems = Number(payload?.total_items ?? raw?.total_items ?? 0);
  const currentPage = Number(payload?.current_pages ?? raw?.current_pages ?? params.pages ?? 1);
  const limit = Number(payload?.items_per_pages ?? raw?.items_per_pages ?? params.limit ?? 10);
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;

  return {
    data: list,
    pagination: { totalItems, totalPages, currentPage, limit },
  };
};
export const useGetInform = (
    params: GetRecInfromParams,
    config?: Omit<
    UseQueryOptions<GetRecInformResponse, Error, GetRecInformResponse, [string, GetRecInfromParams]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ['recinform', params],
        queryFn: () => getAllRecInform(params),
        placeholderData: keepPreviousData,
        ...config
    })
}

export const getRecInformByID = async (id: string) => {
  const res = await apiClient.get(`${URL_API_RECRUITEMENT_INFOR}/${id}`);
  const raw = res.data;

  if (!raw) throw new Error("Recinform not found");

  const payload = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
  const source = payload?.data ?? payload;

  return {
    ...raw,
    data: {
      ...(source as Record<string, unknown>),
      status: normalizeRecruitmentStatus((source as IRecruitmentInfor | undefined)?.status),
    },
  };
};

export const useRecInformID = (
    id: string,
    config?: Omit<
    UseQueryOptions<IRecInformData, Error, IRecInformData, [string, string]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ['recinform', id],
        enabled: !!id,
        queryFn: () => getRecInformByID(id),
        ...config
    })
}