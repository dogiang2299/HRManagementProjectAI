import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CandidateUpsertPayload, ICandidate } from "../types";
import { URL_API_CANDIDATE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";

export const createCandidate = async (data: CandidateUpsertPayload): Promise<ICandidate> => {
    const res = await apiClient.post(URL_API_CANDIDATE, data);
    const payload = res.data?.data ?? res.data;
    const raw = payload?.data ?? payload;
    return raw as ICandidate;
};

type UseCreateCandidateOptions = {
    config?: MutationConfig<typeof createCandidate>;
};

export const useCreateCandidate = ({config}: UseCreateCandidateOptions = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCandidate,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['candidate']});
        },
        ...config,
    });
};

