import { useQueryClient, useMutation } from "@tanstack/react-query";
import { URL_API_RECRUITEMENT_INFOR } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

export const deleteRecInform = async (id: string) => {
  const res = await apiClient.delete(`${URL_API_RECRUITEMENT_INFOR}/${id}`);
  return res.data;
};

export const useDeleteRecInform = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRecInform,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["recinform"] });
      queryClient.removeQueries({ queryKey: ["recinform", id] });
    },
  });
};