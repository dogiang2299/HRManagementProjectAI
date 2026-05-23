import { useMutation, useQueryClient } from "@tanstack/react-query";
import { URL_API_INTERVIEW_SCHE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";
import type { CreateInterviewScheduleDto } from "./create";

export type UpdateInterviewScheduleDto = Partial<CreateInterviewScheduleDto>;

export type UpdateInterviewScheduleInput = {
	id: string;
	data: UpdateInterviewScheduleDto;
};

export const updateInterviewSchedule = async ({
	id,
	data,
}: UpdateInterviewScheduleInput): Promise<any> => {
	const res = await apiClient.put(`${URL_API_INTERVIEW_SCHE}/${id}`, data);
	return res.data?.data ?? res.data;
};

type UseUpdateInterviewScheduleOptions = {
	config?: MutationConfig<typeof updateInterviewSchedule>;
};

export const useUpdateInterviewSchedule = (
	{ config }: UseUpdateInterviewScheduleOptions = {},
) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateInterviewSchedule,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["interview-sche"] });
		},
		...config,
	});
};
