import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { URL_API_INFORCOMPANY } from "../../../../constant/config";
import apiClient from "../../../../lib/api";

type UploadLogoVariables = {
  companyId: string;
  file: File;
};

type UploadLogoResponse = {
  message: string;
  image_logo: string | null;
  logo_url: string | null;
};

const uploadLogo = async ({
  companyId,
  file,
}: UploadLogoVariables): Promise<UploadLogoResponse> => {
  const form = new FormData();
  form.append("logo", file);

  const res = await apiClient.post(
    `${URL_API_INFORCOMPANY}/${companyId}/upload-logo`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
};

type UseUploadLogoOptions = Omit<
  UseMutationOptions<UploadLogoResponse, Error, UploadLogoVariables>,
  "mutationFn" | "onSuccess"
> & {
  onSuccess?: (
    data: UploadLogoResponse,
    variables: UploadLogoVariables,
    context: unknown,
  ) => void;
};

export const useUploadCompanyLogo = (config?: UseUploadLogoOptions) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = config || {};

  return useMutation({
    ...restConfig,
    mutationFn: uploadLogo,
    onSuccess: (data, variables, _onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: ["inform-company"] });
      queryClient.invalidateQueries({ queryKey: ["inform-company", variables.companyId] });

      onSuccess?.(data, variables, context);
    },
  });
};
