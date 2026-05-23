import type { EmployeeStatusType, GenderEmployeeType } from "../../../../constant";
export interface IRole {
  id: string;
  role_code?: string | null;
  name_role?: string | null;
  status: string;
}

export interface IEmployeeRole {
  id: string;
  role: IRole;
}

export interface IEmployee {
  id: string;
  emp_code?: string | null;
  employee_name?: string | null;
  password: string;

  date_of_birth?: Date | null;
  gender?: GenderEmployeeType | null;

  address?: string | null;
  email?: string | null;

  work_unit?: string | null;
  position?: string | null;
  job_title?: string | null;

  director_id?: string | null;

  status: EmployeeStatusType;

  first_day_of_work?: Date | null;
  official_date?: Date | null;

  phone_unit?: string | null;
  email_unit?: string | null;

  email_account: string;
  phone_account: string;

  is_active: boolean;

  created_at: Date;
  updated_at: Date;

  roles?: IEmployeeRole[];
}

export type FormEmployeeValues = {
  emp_code?: string | null;
  employee_name?: string | null;

  password?: string | null;

  date_of_birth?: string | null; // "YYYY-MM-DD"
  gender?: GenderEmployeeType | null;

  address?: string | null;
  email?: string | null;

  work_unit?: string | null;
  position?: string | null;
  job_title?: string | null;

  director_id?: string | null;

  status: EmployeeStatusType;

  first_day_of_work?: string | null; // "YYYY-MM-DD"
  official_date?: string | null; // "YYYY-MM-DD"

  phone_unit?: string | null;
  email_unit?: string | null;

  email_account: string;
  phone_account: string;

  is_active: boolean;

  role_ids?: string[]; // roles selected in the UI
};
