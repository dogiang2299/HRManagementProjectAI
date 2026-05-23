import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import type { IRecInformData } from "./get";
import { URL_API_RECRUITEMENT_INFOR } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

export type RecInformDTO = Partial<IRecInformData>;
interface UpdateRecInformResponse {
    data: IRecInformData,
    count: number;
    error: boolean;
    message: string;
}

const updateRecInform = async(id: string, data: RecInformDTO): Promise<UpdateRecInformResponse> => {
    const res = await apiClient.put(`${URL_API_RECRUITEMENT_INFOR}/${id}`, data);
    return res.data;
}

type UpdateRecInformMutationOptions = Omit<
UseMutationOptions<UpdateRecInformResponse, Error, {id: string, data: RecInformDTO}>,
'onSuccess'
> & {
    onSuccess?: (
        data: UpdateRecInformResponse,
        variables: {id: string; data: RecInformDTO},
        context: unknown
    ) => void;
}

export const useUpdateRecInform = (config?: UpdateRecInformMutationOptions) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, data}) => updateRecInform(id, data),
        onSuccess(data, variables, context) {
            queryClient.invalidateQueries({queryKey: ['recinform']}),
            config?.onSuccess?.(data, variables, context);
        },
        ...config
    })
}