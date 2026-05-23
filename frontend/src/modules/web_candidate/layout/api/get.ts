import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import publicApiClient from "../../../../lib/public-api";
import type { IPositionGroup } from "../type";

export type GetPositionGroupParams = {
  pages?: number;
  limit?: number;
  search?: string;
};

export type PositionGroupPagination = {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

export type GetPositionGroupResponse = {
  data: IPositionGroup[];
  pagination: PositionGroupPagination;
};

export const getAllPositionGroups = async (
  params: GetPositionGroupParams
): Promise<GetPositionGroupResponse> => {
  const res = await publicApiClient.get("/position-group", {
    params: {
      pages: params.pages,
      items_per_pages: params.limit,
      search: params.search,
    },
  });

  const raw = res.data;

  const sourceList: IPositionGroup[] = Array.isArray(raw?.data) ? raw.data : [];

  const totalItems = Number(raw?.total_items ?? 0);
  const currentPage = Number(raw?.current_pages ?? params.pages ?? 1);
  const limit = Number(raw?.items_per_pages ?? params.limit ?? 10);
  const totalPages = Number(
    raw?.total_pages ?? (limit > 0 ? Math.ceil(totalItems / limit) : 0)
  );

  return {
    data: sourceList,
    pagination: {
      totalItems,
      totalPages,
      currentPage,
      limit,
    },
  };
};

export const useGetPositionGroups = (
  params: GetPositionGroupParams = { pages: 1, limit: 6 },
  config?: Omit<
    UseQueryOptions<
      GetPositionGroupResponse,
      Error,
      GetPositionGroupResponse,
      [string, GetPositionGroupParams]
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["position-group", params],
    queryFn: () => getAllPositionGroups(params),
    placeholderData: keepPreviousData,
    ...config,
  });
};