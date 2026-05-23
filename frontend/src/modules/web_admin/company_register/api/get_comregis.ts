import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { ICompanyRegistrationRequest } from "../types";
import { URL_API_COMPANY_REGISTER } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

export type ICompanyRegister = ICompanyRegistrationRequest;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

export type GetCompaniesRegisterParams = {
    page?: number;
    pages?: number;
    limit?: number;
    items_per_pages?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
}

export type GetCompaniesRegisterResponse = {
    data: ICompanyRegister[];
    pagination: Pagination
}

export const getAllComRegister = async (
    params: GetCompaniesRegisterParams
): Promise<GetCompaniesRegisterResponse> => {
    const currentPage = params.page ?? params.pages;
    const perPage = params.limit ?? params.items_per_pages;
    const queryParams = {
        pages: currentPage,
        items_per_pages: perPage,
        search: params.search,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
    };

    const res = await apiClient.get(URL_API_COMPANY_REGISTER, { params: queryParams });
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

export const useGetCompanyRegister = (
    params: GetCompaniesRegisterParams,
    config?: Omit<
    UseQueryOptions<GetCompaniesRegisterResponse, Error, GetCompaniesRegisterResponse, [string, GetCompaniesRegisterParams]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ["company-register", params],
        queryFn: () => getAllComRegister(params),
        placeholderData: keepPreviousData,
        ...config
    })
}

export const getComRegisterByID = async (id: string): Promise<ICompanyRegister> => {
    const res = await apiClient.get(`${URL_API_COMPANY_REGISTER}/${id}`);
    const payload = res.data?.data ?? res.data;

    const raw = payload?.data ?? payload;
    if(!raw) throw new Error('Company register not found');
    return raw as ICompanyRegister
}

export const useGetComRegisterByID = (
    id: string,
    config?: Omit<
    UseQueryOptions<ICompanyRegister, Error, ICompanyRegister, [string, string]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ['company-register', id],
        enabled: !!id,
        ...config
    })
}