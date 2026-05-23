import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_APPLICATION } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { IApplication } from "../types";

export type IApplicationData = IApplication;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number
}

export type GetApplicationParams = {
    page?: number;
    pages?: number;
    limit?: number;
    items_per_pages?: number;
    search?: string;    
    recruitment_infor_id?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
}

export type GetApplicationResponse = {
    data: IApplicationData[];
    pagination: Pagination;
}

const normalizeApplicationList = (responseData: any): IApplicationData[] => {
    const payload = responseData?.data ?? responseData;

    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
};

export const getAllApplication = async (
    params: GetApplicationParams
): Promise<GetApplicationResponse> => {
    const currentPage = params.pages ?? params.page;
    const perPage = params.items_per_pages ?? params.limit;
    const queryParams = {
        pages: currentPage,
        items_per_pages: perPage,
        search: params.search,
        recruitment_infor_id: params.recruitment_infor_id,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
    };

    const res = await apiClient.get(URL_API_APPLICATION, { params: queryParams });

    const payload = res.data?.data ?? res.data;
    const list = normalizeApplicationList(res.data);

    const totalItems = payload?.total_items ?? list.length ?? 0;
    const resolvedCurrentPage = payload?.current_pages ?? payload?.current_page ?? currentPage ?? 1;
    const limit = payload?.items_per_pages ?? payload?.total_per_page ?? perPage ?? 10;
    const safeLimit = limit > 0 ? limit : 10;
    const totalPages = payload?.total_pages ?? Math.max(1, Math.ceil(totalItems / safeLimit));

    return {
        data: list,
        pagination: {
            totalItems,
            totalPages,
            currentPage: resolvedCurrentPage,
            limit: safeLimit,
        }
    }
}
    
export const useGetApplication = (
    params: GetApplicationParams,
    config?: Omit<
    UseQueryOptions<GetApplicationResponse, Error, GetApplicationResponse, [string, GetApplicationParams]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ["applications", params],
        queryFn: () => getAllApplication(params),
        placeholderData: keepPreviousData,
        ...config,
    })
}

export const getApplicationByID = async (id: string): Promise<IApplicationData> => {
    const res = await apiClient.get(`${URL_API_APPLICATION}/${id}`);
    const payload = res.data?.data ?? res.data;

    const raw = payload?.data ?? payload;
    if(!raw) throw new Error('Application not found');
    return raw as IApplicationData
}

export const useApplicationByID = (
    id: string,
    config?: Omit<
    UseQueryOptions<IApplicationData, Error, IApplicationData, [string, string]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ['applications', id],
        enabled: !!id,
        queryFn: () => getApplicationByID(id),
        ...config
    })
}

