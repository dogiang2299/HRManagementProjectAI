import type { BUSSINESS_TYPE } from "../constant";

export interface IInforCompany {
  id: string;

  infor_code?: string | null;
  full_name?: string | null;
  acronym_name?: string | null;
  business_type?: string | BussinessType;
  tax_idennumber?: string | null;
  code_company?: string | null;

  date_stablish?: string | null; // DateTime? @db.Date
  image_logo?: string | null;

  code_business?: string | null;
  date_of_issue?: string | null; // DateTime? @db.Date
  place_of_issue?: string | null;
  employee_quantity?: string | null;

  unit_title?: string | null;
  address?: string | null;
  short_address?: string | null;
  map_link?: string | null;

  phone_number?: string | null;
  fax?: string | null;
  email?: string | null;
  website?: string | null;

  status?: string | null;

  parent_id?: string | null;

  organization_level?: string | null;
  number_arrange?: number | null;
  field_of_activity_id?: string | null;
  field_of_activity_group?: {
    id: string;
    name_group: string;
    slug?: string | null;
  } | null;
  description?: string | null;

  is_active: boolean;
  created_at: string; // DateTime
  updated_at: string; // DateTime

  parent?: IInforCompany | null;
  childrent?: IInforCompany[];

  rankUnits?: any[];
  department?: any[];
  workLocations?: any[];
  positionPosts?: any[];
  registrationRequest?: any[];
  settingEmail?: any[];
}

export type DetailFieldType = "image" | "boolean";

export type DetailField = {
  key: string;
  label: string;
  note?: string;
  type?: DetailFieldType; 
};

export type DetailSection = {
  title: string;
  fields: DetailField[];
};

export type BussinessType = (typeof BUSSINESS_TYPE)[keyof typeof BUSSINESS_TYPE]

export type InforCompanyFormValues = {
  // AUTO (readonly)
  infor_code?: string;

  // Company
  full_name: string;
  acronym_name: string;
  business_type: BussinessType;
  tax_idennumber: string;
  code_company: string; // mã đăng ký DN (user nhập - nếu bạn muốn auto thì nói mình đổi)

  date_stablish: string; // YYYY-MM-DD
  image_logo: string;

  // Registration
  code_business: string;
  date_of_issue: string; // YYYY-MM-DD
  place_of_issue: string;
  employee_quantity: string;

  // Contact
  address: string;
  short_address: string;
  map_link: string;
  phone_number: string;
  fax: string;
  email: string;
  website: string;

  // Other
  status: string;
  field_of_activity_id: string;
  description: string;

  is_active: boolean;
};
