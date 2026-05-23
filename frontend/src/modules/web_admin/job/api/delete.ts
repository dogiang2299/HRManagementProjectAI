import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IJob } from "../types";
import { URL_API_JOBS } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";

export const deleteJob = async (id: string): Promise<IJob> => {
	const res = await apiClient.delete(`${URL_API_JOBS}/${id}`);
	const payload = res.data?.data ?? res.data;
	const raw = payload?.data ?? payload;
	return raw as IJob;
};

type UseDeleteJobOptions = {
	config?: MutationConfig<typeof deleteJob>;
};

export const useDeleteJob = ({ config }: UseDeleteJobOptions = {}) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...restConfig } = config || {};

	return useMutation({
		...restConfig,
		mutationFn: deleteJob,
		onSuccess: (data, id, onMutateResult, context) => {
			queryClient.invalidateQueries({ queryKey: ["jobs"] });
			queryClient.removeQueries({ queryKey: ["jobs", id] });
			queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs"] });
			onSuccess?.(data, id, onMutateResult, context);
		},
	});
};
