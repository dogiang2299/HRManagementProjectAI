import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_EMPLOYEE } from "../../../../constant/config";
import publicApiClient from "../../../../lib/public-api";
import type { IEmployee } from "../type";

export type IEmployeeData = IEmployee;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
};
export type GetEmployeeParams = {
    pages?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc" | string;
};

export type GetEmployeeResponse = {
    data: IEmployee[];
    pagination: Pagination;
};

export const getAllEmployee = async (
    params: GetEmployeeParams
): Promise<GetEmployeeResponse> => {
    const res = await publicApiClient.get(URL_API_EMPLOYEE, {
        params: {
            pages: params.pages,
            items_per_pages: params.limit, // IMPORTANT: keep backend parameter name
            search: params.search,
            status: params.status,
            sortBy: params.sortBy,
            sortOrder: params.sortOrder,
        },
    });

    const raw = res.data;
    const payload = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
    const sourceList = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(raw?.data)
            ? raw.data
            : [];

    const list = sourceList.map((item: IEmployee) => {
        return {
            ...item,
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
        ...config,
    });
};

export const getEmployeeByID = async (id: string): Promise<IEmployeeData> => {
    const res = await publicApiClient.get(`${URL_API_EMPLOYEE}/${id}`);
    const raw = res.data;
    const payload = raw?.data ?? raw;
    const employee = payload?.data ?? payload;

    if (!employee) throw new Error("Employee register not found");
    return employee as IEmployeeData;
};

export const useEmployeeByID = (
    id: string,
    config?: Omit<
    UseQueryOptions<IEmployeeData, Error, IEmployeeData, [string, string]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ["employee", id],
        enabled: !!id,
        queryFn: () => getEmployeeByID(id),
        ...config,
    });
};

