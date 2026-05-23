import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import type { IInforCompany } from "../types";
import { URL_API_INFORCOMPANY } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
                                // biến all field thành optional
export type CompanyUpdateDTO = Partial<IInforCompany>;
interface UpdateCompanyResponse {
    data: IInforCompany;
    count: number;
    error: boolean;
    message: string;
}

export const updateCompany = async(id: string, data: CompanyUpdateDTO): Promise<UpdateCompanyResponse> => {
    const res = await apiClient.put(`${URL_API_INFORCOMPANY}/${id}`, data);
    return res.data;
}

export const updateCompaniesBulk = async (
    ids: string[],
    data: CompanyUpdateDTO,
): Promise<UpdateCompanyResponse[]> => {
    return Promise.all(ids.map((id) => updateCompany(id, data)));
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

export const useUpdateCompany = (config?: UpdateCompanyMutaionOptions) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data}) => updateCompany(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: ['inforcompany']});
            // invalid: đánh dấu cache cũ; tự gọi lại api và ui cập nhật data mới 
            config?.onSuccess?.(data, variables, context);
        },
        ...config
    })
}

type BulkUpdateCompanyMutationOptions = Omit<
    UseMutationOptions<UpdateCompanyResponse[], Error, { ids: string[]; data: CompanyUpdateDTO }>,
    'onSuccess'
> & {
    onSuccess?: (
        data: UpdateCompanyResponse[],
        variables: { ids: string[]; data: CompanyUpdateDTO },
        context: unknown
    ) => void;
}

export const useBulkUpdateCompany = (config?: BulkUpdateCompanyMutationOptions) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ ids, data }) => updateCompaniesBulk(ids, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: ['inforcompany'] });
            config?.onSuccess?.(data, variables, context);
        },
        ...config,
    });
}