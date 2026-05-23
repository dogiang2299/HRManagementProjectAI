import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import apiClient from "../../../../lib/api";

export type IPositionGroupOption = {
  id: string;
  name_group: string;
  slug?: string | null;
};

export type GetPositionGroupParams = {
  pages?: number;
  limit?: number;
  search?: string;
};

export type GetPositionGroupResponse = {
  data: IPositionGroupOption[];
};

export const getPositionGroups = async (
  params: GetPositionGroupParams,
): Promise<GetPositionGroupResponse> => {
  const res = await apiClient.get("position-group", {
    params: {
      pages: params.pages,
      items_per_pages: params.limit,
      search: params.search,
    },
  });

  const raw = res.data?.data ?? res.data;
  const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

  return {
    data: list,
  };
};

export const useGetPositionGroups = (
  params: GetPositionGroupParams,
  config?: Omit<
    UseQueryOptions<GetPositionGroupResponse, Error, GetPositionGroupResponse, [string, GetPositionGroupParams]>,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery({
    queryKey: ["position-group", params],
    queryFn: () => getPositionGroups(params),
    ...config,
  });
};
