import { useQuery, keepPreviousData, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_EMPLOYEE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { IEmployee } from "../types";

export type IEmployeeData = IEmployee;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number
}
export type GetEmployeeParams = {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
}

export type GetEmployeeResponse = {
    data: IEmployee[];
    pagination: Pagination
}

export const getAllEmployee = async (
    params: GetEmployeeParams
): Promise<GetEmployeeResponse> => {
    const queryParams = {
        page: params.page,
        items_per_pages: params.limit,
        search: params.search,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
    };

    const res = await apiClient.get(URL_API_EMPLOYEE, { params: queryParams });
        const raw =
            res.data?.data && !Array.isArray(res.data.data)
                ? res.data.data
                : res.data;

    const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

    const totalItems = raw?.total_items ?? list.length ?? 0;
    const currentPage = raw?.current_page ?? params.page ?? 1;
    const limit = raw?.items_per_page ?? params.limit ?? 10;
    const totalPages = raw?.total_pages ?? Math.ceil(totalItems / limit);

    return {
        data: list,
        pagination: {
            totalItems, totalPages, currentPage, limit
        }
        
    }
}

export const useGetEmployee = (
    params: GetEmployeeParams,
    config?: Omit<
    UseQueryOptions<GetEmployeeResponse, Error, GetEmployeeResponse, [string, GetEmployeeParams]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ["employee", params],
        queryFn: () => getAllEmployee(params),
        placeholderData: keepPreviousData,
        ...config
    })
}

export const getEmployeeByID = async (id: string): Promise<IEmployeeData> => {
    const res = await apiClient.get(`${URL_API_EMPLOYEE}/${id}`);
    const payload = res.data?.data ?? res.data;

    const raw = payload?.data ?? payload;
    if(!raw) throw new Error('Employee register not found');
    return raw as IEmployeeData
}

export const useEmployeeByID = (
    id: string,
    config?: Omit<
    UseQueryOptions<IEmployeeData, Error, IEmployeeData, [string, string]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ['employee', id],
        enabled: !!id,
        queryFn: () => getEmployeeByID(id),
        ...config
    })
}

