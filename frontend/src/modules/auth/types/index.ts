import type { IEmployee } from "../../web_admin/employee/types";

export interface LoginRespone {
  accessToken?: string;
  refreshToken?: string;
  user?: IEmployee;
  require_change_password?: boolean;
  user_id?: string;
  message?: string;
}