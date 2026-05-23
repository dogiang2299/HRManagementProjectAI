import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { IInforCompany } from "../types";
import { URL_API_INFORCOMPANY } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

export type CompanyID = IInforCompany;
export type Pagination = {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
}

export type GetCompaniesParams = {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc' | string;
}

export type GetCompaniesResponse = {
    data: CompanyID[];
    pagination: Pagination
}

//#region API GET ALL
export const getAllCompanies = async (
  params: GetCompaniesParams
): Promise<GetCompaniesResponse> => {
    const queryParams = {
        page: params.page,
        items_per_page: params.limit,
        search: params.search,
        status: params.status,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
    };

    const res = await apiClient.get(URL_API_INFORCOMPANY, { params: queryParams });

    const raw =
        res.data?.data && !Array.isArray(res.data.data)
            ? res.data.data
            : res.data;

  // nếu raw là object như backend trả
  const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

  const totalItems = raw?.total_items ?? list.length ?? 0;
  const currentPage = raw?.current_page ?? params.page ?? 1;
    const limit = raw?.items_per_page ?? raw?.item_per_page ?? params.limit ?? 10;
  const totalPages = raw?.total_pages ?? Math.ceil(totalItems / limit);

  return {
    data: list,
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      limit,
    },
  };
};

//#region HOOK LIST
export const useGetCompanies = (
    params: GetCompaniesParams,
    config?: Omit<
    UseQueryOptions<GetCompaniesResponse, Error, GetCompaniesResponse, [string, GetCompaniesParams]>,
    "queryKey" | "queryFn"
  >,
) => {
    return useQuery ({
        queryKey: ["inforcompany", params],
        queryFn: () => getAllCompanies(params),
        placeholderData: keepPreviousData,
        ...config
    })
};

//#region  API: GET BY ID 
// call api thuần mà chưa có động đến React
export const getCompanyByID = async (id: string): Promise<CompanyID> => {
    const res = await apiClient.get(`${URL_API_INFORCOMPANY}/${id}`);
    const payload = res.data?.data ?? res.data;
    const raw = payload?.data ?? payload;
    if(!raw) throw new Error('Company not found');
    return raw as CompanyID;
}

//#region  HOOK: BY ID 
export const useGetCompanyByID = (
    id: string,
    config?: Omit< // TQueryFnData, TError, TData, TQueryKey
    UseQueryOptions<CompanyID, Error, CompanyID, [string, string]>,
    "queryKey" | "queryFn"

//     | Vị trí           | Ý nghĩa                               | Trong code bạn   |
// | ---------------- | ------------------------------------- | ---------------- |
// | 1️⃣ TQueryFnData | Kiểu dữ liệu trả về từ API            | CompanyID        | => kiểu API trả về
// | 2️⃣ TError       | Kiểu lỗi                              | Error            |
// | 3️⃣ TData        | Kiểu dữ liệu sau khi select/transform | CompanyID        | => nếu BE là dạng 2026-02-25T00:00:00.000Z và UI muốn hiển thị  DD/MM/YYYY thì sẽ transform về đúng như UI cần
// | 4️⃣ TQueryKey    | Kiểu của queryKey                     | [string, string] |
    >,
) => {
    return useQuery({
        queryKey: ["inforcompany", id],
        queryFn: () => getCompanyByID(id),
        enabled: !!id,
        ...config
    })
}