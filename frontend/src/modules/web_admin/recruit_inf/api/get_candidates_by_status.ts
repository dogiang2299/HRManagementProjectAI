import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { URL_API_APPLICATION } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

export type RecruitmentCandidateApplication = {
    id: string;
    status: string;
    note?: string | null;
    applied_at?: string | null;
    created_at?: string;
    candidate?: {
        id: string;
        candidate_code?: string | null;
        candidate_name?: string | null;
        phone_number?: string | null;
        email?: string | null;
        avatar_file?: string | null;
        cv_file?: string | null;
    } | null;
};

export type GetRecruitmentCandidatesByStatusParams = {
    recruitmentId: string;
    status: string;
};

export type GetRecruitmentCandidatesByStatusResponse = {
    data: RecruitmentCandidateApplication[];
};

const normalizeList = (responseData: any): RecruitmentCandidateApplication[] => {
    const payload = responseData?.data ?? responseData;

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;

    return [];
};

export const getRecruitmentCandidatesByStatus = async (
    params: GetRecruitmentCandidatesByStatusParams,
): Promise<GetRecruitmentCandidatesByStatusResponse> => {
    const res = await apiClient.get(
        `${URL_API_APPLICATION}/recruitment/${params.recruitmentId}/candidates`,
        {
            params: {
                status: params.status,
            },
        },
    );

    return {
        data: normalizeList(res.data),
    };
};

export const useRecruitmentCandidatesByStatus = (
    params: GetRecruitmentCandidatesByStatusParams,
    config?: Omit<
        UseQueryOptions<
            GetRecruitmentCandidatesByStatusResponse,
            Error,
            GetRecruitmentCandidatesByStatusResponse,
            [string, GetRecruitmentCandidatesByStatusParams]
        >,
        "queryKey" | "queryFn"
    >,
) => {
    return useQuery({
        queryKey: ["recruitment-candidates-by-status", params],
        queryFn: () => getRecruitmentCandidatesByStatus(params),
        enabled: !!params.recruitmentId && !!params.status,
        ...config,
    });
};
