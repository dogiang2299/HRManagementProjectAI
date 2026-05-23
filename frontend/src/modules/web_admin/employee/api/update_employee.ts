import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { URL_API_EMPLOYEE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { IEmployeeData } from "./get_employee";
                                // biến all field thành optional
export type EmployeeUpdateDTO = Partial<IEmployeeData>;
interface UpdateEmployeeResponse {
    data: IEmployeeData;
    count: number;
    error: boolean;
    message: string;
}

const updateEmployee = async(id: string, data: EmployeeUpdateDTO): Promise<UpdateEmployeeResponse> => {
    const res = await apiClient.put(`${URL_API_EMPLOYEE}/${id}`, data);
    return res.data;
}

type UpdateEmployeeMutaionOptions = Omit< // lấy 1 type, bỏ 1 thuộc tính khỏi type      // TVaribales: mutate truyền gì vào: kiểu của “tham số đầu vào” của mutation.
    UseMutationOptions<UpdateEmployeeResponse, Error, {id: string, data: EmployeeUpdateDTO}>,
    'onSuccess' 
> & {
    onSuccess?: (
        data: UpdateEmployeeResponse,
        variables: {id: string; data: EmployeeUpdateDTO},
        context: unknown
    ) => void;
}

export const useUpdateEmployee = (config?: UpdateEmployeeMutaionOptions) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data}) => updateEmployee(id, data),
        onSuccess: (data, variables, context) => {
            queryClient.invalidateQueries({ queryKey: ['employee']});
            config?.onSuccess?.(data, variables, context);
        },
        ...config
    })
}