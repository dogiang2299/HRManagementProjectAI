import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import type { IJobData } from "./get";
import type { JobStatusType } from "../../../../constant";
import { URL_API_JOBS } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

export type JobUpdateDTO = Partial<IJobData> & {
	candidate_ids?: string[];
	status?: JobStatusType;
};

type UpdateJobResponse = IJobData;

const updateJob = async (id: string, data: JobUpdateDTO): Promise<UpdateJobResponse> => {
	const res = await apiClient.put(`${URL_API_JOBS}/${id}`, data);
	const payload = res.data?.data ?? res.data;
	const raw = payload?.data ?? payload;
	return raw as UpdateJobResponse;
};

type UpdateJobMutationOptions = Omit<
	UseMutationOptions<UpdateJobResponse, Error, { id: string; data: JobUpdateDTO }>,
	"onSuccess"
> & {
	onSuccess?: (
		data: UpdateJobResponse,
		variables: { id: string; data: JobUpdateDTO },
		context: unknown,
	) => void;
};

export const useUpdateJob = (config?: UpdateJobMutationOptions) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...restConfig } = config || {};

	return useMutation({
		...restConfig,
		mutationFn: ({ id, data }) => updateJob(id, data),
		onSuccess: (data, variables, _onMutateResult, context) => {
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
			queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs"] });
			onSuccess?.(data, variables, context);
		},
	});
};
