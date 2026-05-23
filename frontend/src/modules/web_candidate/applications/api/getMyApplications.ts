import { apiClient } from "../../../../lib/api";

export const ensureConversationForApplication = async (
  applicationId: string,
) => {
  const res = await apiClient.post(
    `/conversations/application/${applicationId}/open`,
  );

  return res.data?.data ?? res.data;
};