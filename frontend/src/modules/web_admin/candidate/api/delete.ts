import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ICandidate } from "../types";
import { URL_API_CANDIDATE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";

export const deleteCandidate = async (id: string): Promise<ICandidate> => {
	const res = await apiClient.delete(`${URL_API_CANDIDATE}/${id}`);
	const payload = res.data?.data ?? res.data;
	const raw = payload?.data ?? payload;
	return raw as ICandidate;
};

type UseDeleteCandidateOptions = {
	config?: MutationConfig<typeof deleteCandidate>;
};

export const useDeleteCandidate = ({ config }: UseDeleteCandidateOptions = {}) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...restConfig } = config || {};

	return useMutation({
		...restConfig,
		mutationFn: deleteCandidate,
		onSuccess: (data, id, onMutateResult, context) => {
			queryClient.invalidateQueries({ queryKey: ["candidate"] });
			queryClient.removeQueries({ queryKey: ["candidate", id] });
			queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs", id] });
			onSuccess?.(data, id, onMutateResult, context);
		},
	});
};
