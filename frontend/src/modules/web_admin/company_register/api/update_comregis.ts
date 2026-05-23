import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import type { ICompanyRegister } from "./get_comregis";
import { URL_API_COMPANY_REGISTER } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
                                // biến all field thành optional
export type CompanyUpdateDTO = Partial<ICompanyRegister>;
interface UpdateCompanyResponse {
    data: ICompanyRegister;
    count: number;
    error: boolean;
    message: string;
}

const updateCompanyRegister = async(id: string, data: CompanyUpdateDTO): Promise<UpdateCompanyResponse> => {
    const res = await apiClient.put(`${URL_API_COMPANY_REGISTER}/${id}`, data);
    return res.data;
}

type UpdateCompanyMutaionOptions = Omit< // lấy 1 type, bỏ 1 thuộc tính khỏi type      // TVaribales: mutate truyền gì vào: kiểu của “tham số đầu vào” của mutation.
    UseMutationOptions<UpdateCompanyResponse, Error, {id: string, data: CompanyUpdateDTO}>,
    'onSuccess' //TContext => bỏ đi onsucess vfi định nghĩa riêng
> & {
    onSuccess?: (
        data: UpdateCompanyResponse,
        variables: {id: string; data: CompanyUpdateDTO},
        context: unknown
    ) => void;
}

export const useUpdateCompanyRegister = (config?: UpdateCompanyMutaionOptions) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data}) => updateCompanyRegister(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: ['company-register']});
            config?.onSuccess?.(data, variables, context);
        },
        ...config
    })
}