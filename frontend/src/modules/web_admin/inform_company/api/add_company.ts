import { URL_API_INFORCOMPANY } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";
import type { IInforCompany } from "../types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const createCompany = async (data: IInforCompany): Promise<any> => {
    const res = await apiClient.post(URL_API_INFORCOMPANY, data);
    const raw = res.data;
    return raw?.data ?? raw;
}

type UseCreateCompanyOptions = {
    config?: MutationConfig<typeof createCompany>;
}

export const useCreateCompany = ({config}: UseCreateCompanyOptions = {}) => {
    const queryClient = useQueryClient(); //đọc dữ liệu 
    return useMutation({ // thay đổi dữ liệu
        mutationFn: createCompany,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inforcompany']});
        },
        ...config
    })
}