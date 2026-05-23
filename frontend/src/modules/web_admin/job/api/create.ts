import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IJob } from "../types";
import type { JobStatusType } from "../../../../constant";
import { URL_API_JOBS } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";

export type CreateJobDTO = Omit<IJob, "id" | "created_at" | "updated_at" | "employee" | "jobCandidates"> & {
	employee_id: string;
	candidate_ids?: string[];
	status?: JobStatusType;
};

export const createJob = async (data: CreateJobDTO): Promise<IJob> => {
	const res = await apiClient.post(URL_API_JOBS, data);
	const payload = res.data?.data ?? res.data;
	const raw = payload?.data ?? payload;
	return raw as IJob;
};

type UseCreateJobOptions = {
	config?: MutationConfig<typeof createJob>;
};

export const useCreateJob = ({ config }: UseCreateJobOptions = {}) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...restConfig } = config || {};

	return useMutation({
		...restConfig,
		mutationFn: createJob,
		onSuccess: (data, variables, onMutateResult, context) => {
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
			queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs"] });
			onSuccess?.(data, variables, onMutateResult, context);
		},
	});
};
