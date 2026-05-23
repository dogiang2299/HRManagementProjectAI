
export type MailConfigResponse = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  from: string;
  fromName?: string;
};

export type TestConnectionResponse = {
  success: boolean;
  message: string;
};

export type SendTestEmailResponse = {
  success: boolean;
  message: string;
  messageId?: string;
  response?: string;
};
