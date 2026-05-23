import apiClient from "../../../../lib/api";
import type { MailConfigResponse, TestConnectionResponse, SendTestEmailResponse } from "../type/mailServer.api";

export const mailServerApi = {
  async getConfig(): Promise<MailConfigResponse> {
    const res = await apiClient.get("/mail/config");
    return res.data;
  },

  async testConnection(): Promise<TestConnectionResponse> {
    const res = await apiClient.get("/mail/verify");
    return res.data;
  },

  async sendTestEmail(to: string): Promise<SendTestEmailResponse> {
    const res = await apiClient.post("/mail/send-test", { to });
    return res.data;
  },
};