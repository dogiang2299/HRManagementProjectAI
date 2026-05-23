import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import publicApiClient from "../../../../lib/public-api";
import type {
  GetCompanyInformResponse,
  GetCompanyInfromParams,
  ICompanyDetail,
  ICompanyInfoCard,
} from "../type";

export const getAllCompany = async (params: GetCompanyInfromParams) => {
  const res = await publicApiClient.get("/inforcompany", {
    params: {
      // Backend expects page + items_per_page for pagination.
      page: params.pages,
      items_per_page: params.limit,
      search: params.search,
      status: params.status,
    },
  });

  const raw = res.data;
  const payload = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
  const sourceList = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(raw?.data)
      ? raw.data
      : [];

  const list = sourceList.map((item: ICompanyInfoCard) => {
    return {
      ...item,
    };
  });

  const totalItems = Number(payload?.total_items ?? raw?.total_items ?? 0);
  const currentPage = Number(
    payload?.current_page ??
      raw?.current_page ??
      payload?.current_pages ??
      raw?.current_pages ??
      params.pages ??
      1
  );
  const limit = Number(
    payload?.item_per_page ??
      raw?.item_per_page ??
      payload?.items_per_pages ??
      raw?.items_per_pages ??
      params.limit ??
      10
  );
  const totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;

  return {
    data: list,
    pagination: { totalItems, totalPages, currentPage, limit },
  };
};
export const useGetCompanyCandidate = (
    params: GetCompanyInfromParams,
    config?: Omit<
    UseQueryOptions<GetCompanyInformResponse, Error, GetCompanyInformResponse, [string, GetCompanyInfromParams]>,
    "queryKey" | "queryFn"
    >
) => {
    return useQuery({
        queryKey: ['inforcompany', params],
        queryFn: () => getAllCompany(params),
        placeholderData: keepPreviousData,
        ...config
    })
}

export const getCompanyByID = async (id: string): Promise<ICompanyDetail> => {
  const res = await publicApiClient.get(`/inforcompany/${id}`);
  const raw = res.data;
  const payload = raw?.data ?? raw;
  const company = payload?.data ?? payload;

  if (!company) throw new Error("Company not found");
  return company as ICompanyDetail;
};

export const useGetCompanyByID = (
  id: string,
  config?: Omit<UseQueryOptions<ICompanyDetail, Error, ICompanyDetail, [string, string]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["inforcompany", id],
    enabled: !!id,
    queryFn: () => getCompanyByID(id),
    ...config,
  });
};

export const getCompanyField = async (id: string): Promise<ICompanyInfoCard[]> => {
  const res = await publicApiClient.get(`/inforcompany/field/${id}`);
  const raw = res.data;
  const payload = raw?.data ?? raw;
  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];

  return list as ICompanyInfoCard[];
};

export const useGetCompaniesRelated = (
  companyId: string,
  config?: Omit<UseQueryOptions<ICompanyInfoCard[], Error, ICompanyInfoCard[], [string, string]>, "queryKey" | "queryFn">
) => {
  return useQuery({
    queryKey: ["inforcompany-related-field", companyId],
    enabled: !!companyId,
    queryFn: () => getCompanyField(companyId),
    ...config,
  });
};
