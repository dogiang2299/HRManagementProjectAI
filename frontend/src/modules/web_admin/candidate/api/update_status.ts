import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import type { UpdateApplicationStatusDTO, UpdateApplicationStatusResponse } from "../types";
import { URL_API_APPLICATION } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

const updateApplicationStatus = async (
	id: string,
	data: UpdateApplicationStatusDTO,
): Promise<UpdateApplicationStatusResponse> => {
	const res = await apiClient.patch(`${URL_API_APPLICATION}/${id}/status`, data);
	return res.data;
};

type UpdateApplicationStatusMutationOptions = Omit<
	UseMutationOptions<UpdateApplicationStatusResponse, Error, { id: string; data: UpdateApplicationStatusDTO }>,
	"onSuccess"
> & {
	onSuccess?: (
		data: UpdateApplicationStatusResponse,
		variables: { id: string; data: UpdateApplicationStatusDTO },
		context: unknown,
	) => void;
};

export const useUpdateApplicationStatus = (config?: UpdateApplicationStatusMutationOptions) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...restConfig } = config || {};

	return useMutation({
		...restConfig,
		mutationFn: ({ id, data }) => updateApplicationStatus(id, data),
		onSuccess: (data, variables, _onMutateResult, context) => {
			queryClient.invalidateQueries({ queryKey: ["candidate"] });
			queryClient.invalidateQueries({ queryKey: ["application"] });
			queryClient.invalidateQueries({ queryKey: ["candidate-audit-logs"] });
			onSuccess?.(data, variables, context);
		},
	});
};
