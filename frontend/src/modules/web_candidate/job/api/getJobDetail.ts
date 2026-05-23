import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import publicApiClient from "../../../../lib/public-api";
import type { IRecInformData } from "../types/job";

type JobDetailParams = {
  source?: string;
};

const getStoredAccessToken = () => {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.state?.accessToken || null;
  } catch {
    return null;
  }
};

export const getRecInformByID = async (
  id: string,
  params?: JobDetailParams
): Promise<IRecInformData> => {
  const accessToken = getStoredAccessToken();
  const res = await publicApiClient.get(`/recinform/${id}`, {
    params,
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });
  const raw = res.data;

  const payload = raw?.data ?? raw;

  if (!payload) {
    throw new Error("Recinform not found");
  }

  return payload;
};

export const useGetJobDetail = (
  id: string,
  params?: JobDetailParams,
  config?: Omit<
    UseQueryOptions<
      IRecInformData,
      Error,
      IRecInformData,
      [string, string, JobDetailParams | undefined]
    >,
    "queryKey" | "queryFn"
  >
) => {
  return useQuery({
    queryKey: ["job-detail", id, params],
    enabled: !!id,
    queryFn: () => getRecInformByID(id, params),
    ...config,
  });
};
