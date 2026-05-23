import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CandidateUpsertPayload, ICandidate } from "../types";
import { URL_API_CANDIDATE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";

export type CandidateUpdateDTO = Partial<CandidateUpsertPayload>;

type UpdateCandidateInput = {
    id: string;
    data: CandidateUpdateDTO;
};

const updateCandidate = async ({ id, data }: UpdateCandidateInput): Promise<ICandidate> => {
    const res = await apiClient.put(`${URL_API_CANDIDATE}/${id}`, data);
    const payload = res.data?.data ?? res.data;
    const raw = payload?.data ?? payload;
    return raw as ICandidate;
};

type UpdateCandidateMutationOptions = {
    config?: MutationConfig<typeof updateCandidate>;
};

export const useupdateCandidate = ({ config }: UpdateCandidateMutationOptions = {}) => {
    const queryClient = useQueryClient();
    const { onSuccess, ...restConfig } = config || {};

    return useMutation({
        ...restConfig,
        mutationFn: updateCandidate,
        onSuccess: (data, variables, onMutateResult, context) => {
            queryClient.invalidateQueries({ queryKey: ['candidate']});
            queryClient.invalidateQueries({ queryKey: ['candidate-audit-logs', variables.id] });
            onSuccess?.(data, variables, onMutateResult, context);
        },
    });
};