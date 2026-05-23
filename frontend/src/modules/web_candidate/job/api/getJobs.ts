import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import publicApiClient from "../../../../lib/public-api";
import type { GetRecInformResponse, GetRecInfromParams, IRecruitmentInfor } from "../types/job";
import { buildRecruitmentActivities } from "../../../web_admin/recruit_inf/utils";

export const getAllRecInform = async (params: GetRecInfromParams) => {
  const res = await publicApiClient.get("/recinform", {
    params: {
      pages: params.pages,
      items_per_pages: params.limit, // IMPORTANT: keep backend parameter name
      search: params.search,
      status: params.status,
      department_id: params.department_id,
      work_location_id: params.work_location_id,
      position_post_id: params.position_post_id,
      position_group_id: params.position_group_id,
      exclude_id: params.exclude_id,
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
    const workLocationName =
      item.workLocation?.short_address ??
      item.work_location_name ??
      item.workLocation?.full_name ??
      null;

    return {
      ...item,
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
export const useGetJobs = (
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
