import { keepPreviousData, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { IJob } from "../types";
import  { URL_API_JOBS } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

export type IJobData = IJob;

export type Pagination = {
	totalItems: number;
	totalPages: number;
	currentPage: number;
	limit: number;
};

export type GetJobParams = {
	pages?: number;
	limit?: number;
	search?: string;
	status?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc" | string;
};

export type GetJobResponse = {
	data: IJob[];
	pagination: Pagination;
};

export const getAllJob = async (params: GetJobParams): Promise<GetJobResponse> => {
	const res = await apiClient.get(URL_API_JOBS, {
		params: {
			pages: params.pages,
			items_per_pages: params.limit,
			search: params.search,
			status: params.status,
			sortBy: params.sortBy,
			sortOrder: params.sortOrder,
		},
	});

	const raw =
		res.data?.data && !Array.isArray(res.data.data)
			? res.data.data
			: res.data;
	const list = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

	const totalItems = raw?.total_items ?? list.length ?? 0;
	const currentPage = raw?.current_pages ?? raw?.current_page ?? params.pages ?? 1;
	const limit = raw?.items_per_pages ?? raw?.total_per_page ?? params.limit ?? 10;
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

export const useGetJob = (
	params: GetJobParams,
	config?: Omit<
		UseQueryOptions<GetJobResponse, Error, GetJobResponse, [string, GetJobParams]>,
		"queryKey" | "queryFn"
	>,
) => {
	return useQuery({
		queryKey: ["jobs", params],
		queryFn: () => getAllJob(params),
		placeholderData: keepPreviousData,
		...config,
	});
};

export const getJobByID = async (id: string): Promise<IJobData> => {
	const res = await apiClient.get(`${URL_API_JOBS}/${id}`);
	const payload = res.data?.data ?? res.data;
	const raw = payload?.data ?? payload;

	if (!raw) {
		throw new Error("Job not found");
	}

	return raw as IJobData;
};

export const useJobByID = (
	id: string,
	config?: Omit<UseQueryOptions<IJobData, Error, IJobData, [string, string]>, "queryKey" | "queryFn">,
) => {
	return useQuery({
		queryKey: ["jobs", id],
		enabled: !!id,
		queryFn: () => getJobByID(id),
		...config,
	});
};
