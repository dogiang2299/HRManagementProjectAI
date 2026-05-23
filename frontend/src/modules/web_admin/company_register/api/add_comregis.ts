import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FormValues, ICompanyRegistrationRequest } from "../types";
import { URL_API_COMPANY_REGISTER } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";

export type CreateCompanyRegisterPayload = Partial<FormValues> & {
    companyName: string;
    email: string;
};

export const createCompanyRegister = async (
    data: CreateCompanyRegisterPayload,
): Promise<ICompanyRegistrationRequest> => {
    const res = await apiClient.post(URL_API_COMPANY_REGISTER, data);
        return res.data.data ?? res.data;
};

type UseCreateCompanyRegisterOptions = {
    config?: MutationConfig<typeof createCompanyRegister>;
}

export const useCreateCompanyRegister = ({config}: UseCreateCompanyRegisterOptions = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCompanyRegister,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-register']})
        },
        ...config
    })
}