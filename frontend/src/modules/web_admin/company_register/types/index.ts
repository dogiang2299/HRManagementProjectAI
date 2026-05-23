import type { CompanyRegistrationStatusType } from "../../../../constant";
import type { IEmployee } from "../../employee/types";
import type { IInforCompany } from "../../inform_company/types";

export interface ICompanyRegistrationRequest {
  id: string;

  companyName: string;
  email: string;

  phone?: string | null;
  address?: string | null;
  website?: string | null;
  recruitmentNeeds?: string | null;
  source?: string | null;

  status: CompanyRegistrationStatusType;

  createdAt: string; // ISO string
  approvedAt?: string | null;

  adminNote?: string | null;

  createdById?: string | null;
  createdBy?: IEmployee | null;

  is_active: boolean;

  inforCompanyId?: string | null;
  inforCompany?: IInforCompany | null;
}

export type FormValues = {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  recruitmentNeeds: string;
  source: string;
  status: CompanyRegistrationStatusType;
  approvedAt: string; 
  adminNote: string;
  is_active: boolean;
};