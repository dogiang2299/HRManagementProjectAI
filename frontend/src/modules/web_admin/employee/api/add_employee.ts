import { useMutation, useQueryClient } from "@tanstack/react-query";
import { URL_API_EMPLOYEE } from "../../../../constant/config";
import apiClient from "../../../../lib/api";
import type { MutationConfig } from "../../../../lib/react-query";
import type { IEmployee } from "../types";

export const createEmployee = async (data: IEmployee): Promise<any> => {
    const res = await apiClient.post(URL_API_EMPLOYEE, data);
    return res.data.data;
}

type UseCreateEmployeeOptions = {
    config?: MutationConfig<typeof createEmployee>;
}

export const useCreateEmployee = ({config}: UseCreateEmployeeOptions = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['employee']})
        },
        ...config
    })
}

export const uploadEmployeeAvatar = async (employeeId: string, file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await apiClient.put(`${URL_API_EMPLOYEE}/${employeeId}/avatar`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    return res.data?.data ?? res.data;
};

export const useUploadEmployeeAvatar = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ employeeId, file }: { employeeId: string; file: File }) =>
            uploadEmployeeAvatar(employeeId, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employee"] });
        },
    });
};

