import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { IEmployeeData } from "./get_employee";
import { URL_API_EMPLOYEE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";

export const deleteEmployee = async (id: string): Promise<IEmployeeData> => {
	const res = await apiClient.delete(`${URL_API_EMPLOYEE}/${id}`);
	const payload = res.data?.data ?? res.data;
	const raw = payload?.data ?? payload;
	return raw as IEmployeeData;
};

type UseDeleteEmployeeOptions = {
	config?: MutationConfig<typeof deleteEmployee>;
};

export const useDeleteEmployee = ({ config }: UseDeleteEmployeeOptions = {}) => {
	const queryClient = useQueryClient();
	const { onSuccess, ...restConfig } = config || {};

	return useMutation({
		...restConfig,
		mutationFn: deleteEmployee,
		onSuccess: (data, id, onMutateResult, context) => {
			queryClient.invalidateQueries({ queryKey: ["employee"] });
			queryClient.removeQueries({ queryKey: ["employee", id] });
			onSuccess?.(data, id, onMutateResult, context);
		},
	});
};