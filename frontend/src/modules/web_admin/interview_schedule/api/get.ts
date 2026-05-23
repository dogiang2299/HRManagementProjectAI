import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_INTERVIEW_SCHE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { IInterviewSchedule } from "../types";

export type IInterviewData = IInterviewSchedule;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number
}

export type GetInterviewParams = {
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

export type GetInterviewResponse = {
    data: IInterviewSchedule[];
    pagination: Pagination;
}

export const getAllInterview = async (
    params: GetInterviewParams
): Promise<GetInterviewResponse> => {
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

    const res = await apiClient.get(URL_API_INTERVIEW_SCHE, { params: queryParams });
        const raw =
            res.data?.data && !Array.isArray(res.data.data)
                ? res.data.data
                : res.data;

    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

    const totalItems = raw?.total_items ?? list.length ?? 0;
    const resolvedCurrentPage = raw?.current_pages ?? raw?.current_page ?? currentPage ?? 1;
    const limit = raw?.items_per_pages ?? raw?.total_per_page ?? perPage ?? 10;
    const totalPages = raw?.total_pages ?? Math.ceil(totalItems / limit);
    return {
        data: list,
        pagination: {
            totalItems, totalPages, currentPage: resolvedCurrentPage, limit
        }
    }
}
    
export const useGetInterview = (
    params: GetInterviewParams,
    config?: Omit<
    UseQueryOptions<GetInterviewResponse, Error, GetInterviewResponse, [string, GetInterviewParams]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ["interview-sche", params],
        queryFn: () => getAllInterview(params),
        placeholderData: keepPreviousData,
        ...config,
    })
}

export const getInterviewByID = async (id: string): Promise<IInterviewSchedule> => {
    const res = await apiClient.get(`${URL_API_INTERVIEW_SCHE}/${id}`);
    const payload = res.data?.data ?? res.data;

    const raw = payload?.data ?? payload;
    if(!raw) throw new Error('Interview not found');
    return raw as IInterviewData
}

export const useInterviewByID = (
    id: string,
    config?: Omit<
    UseQueryOptions<IInterviewData, Error, IInterviewData, [string, string]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ['interview-sche', id],
        enabled: !!id,
        queryFn: () => getInterviewByID(id),
        ...config
    })
}

