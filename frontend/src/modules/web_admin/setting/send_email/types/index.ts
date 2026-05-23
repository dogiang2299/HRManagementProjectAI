export interface ISettingEmail {
  id: string;
  sec_code?: string | null;
  name?: string | null;
  unit_id?: string | null;
  subject?: string | null;
  body?: string | null;
  auto_send?: boolean | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  inforCompany?: {
    id: string;
    full_name?: string | null;
    acronym_name?: string | null;
  } | null;
}

export interface SendEmailFormValues {
  name: string;
  unit_id: string;
  subject: string;
  body: string;
  auto_send: boolean;
}
