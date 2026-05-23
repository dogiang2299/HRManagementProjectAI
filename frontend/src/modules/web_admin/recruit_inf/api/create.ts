import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RecruitmentStatusType } from "../../../../constant";
import { URL_API_RECRUITEMENT_INFOR } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";
import type { IRecruitmentInfor } from "../types";

export interface CreateRecInformDTO {
    internal_title?: string;
    post_title?: string;
    department_id: string;
    work_location_id: string;
    rank_id: string;
    contact_person_id?: string;
    type_of_job?: string;
    application_deadline?: string;
    total_needed?: number;
    salary_from?: number;
    salary_to?: number;
    salary_currency?: string;
    status?: RecruitmentStatusType;
    is_active?: boolean;
    position_post_id: string;
    skills?: Array<{
        skill_id: string;
        level?: number;
        is_required?: boolean;
    }>;
    other_costs?: Array<{
        cost_type?: string;
        amount?: number;
        currency?: string;
    }>;
    plan?: Array<{
        total_real_number?: number;
        monthly_target?: string;
        expected_deadline?: string;
        batches?: Array<{
            batches_title?: string;
            from_date?: string;
            to_date?: string;
            number_recruitment?: number;
            monthly_target?: string;
        }>;
    }>;
}

export const createRecInform = async (data: CreateRecInformDTO): Promise<IRecruitmentInfor> => {
    const res = await apiClient.post(URL_API_RECRUITEMENT_INFOR, data);
    return res.data.data;
}

type UseCreateRecInformOptions = {
    config?: MutationConfig<typeof createRecInform>;
}

export const useCreateRecInform = ({config}: UseCreateRecInformOptions = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createRecInform,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['recinform']})
        },
        ...config
    })
}
