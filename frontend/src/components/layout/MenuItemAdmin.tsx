import {
  activityUrl,
  advancedUrl,
  companyRegisterUrl,
  employeeUrl,
  generalUrl,
  inforCompanyUrl,
  mailServerUrl,
} from "../../routes/urls";
import { RECRUIT_BASE_ROLE } from "../../constant/roles";
import type { IMenuItem } from "./MenuItem";

import { FaBuilding, FaShieldAlt, FaHistory, FaCog, FaUsers } from "react-icons/fa";
import { MdAppRegistration, MdEmail } from "react-icons/md";

export const defaultMenusAdmin: IMenuItem[] = [
  {
    path: inforCompanyUrl,
    name: "Companies",
    icon: <FaBuilding size={18} color="#4a5568" />,
    roles: [RECRUIT_BASE_ROLE.Admin, RECRUIT_BASE_ROLE.Employee],
  },
  {
    path: companyRegisterUrl,
    name: "Company Requests",
    icon: <MdAppRegistration size={18} color="#4a5568" />,
    roles: [RECRUIT_BASE_ROLE.Admin, RECRUIT_BASE_ROLE.Employee],
  },
  {
    path: employeeUrl,
    name: "Employees",
    icon: <FaUsers size={18} color="#4a5568" />,
    roles: [RECRUIT_BASE_ROLE.Admin],
  },
  {
    path: mailServerUrl,
    name: "Mail Server",
    icon: <MdEmail size={18} color="#4a5568" />,
    roles: [RECRUIT_BASE_ROLE.Admin],
  },
  {
    path: advancedUrl,
    name: "Advanced Security",
    icon: <FaShieldAlt size={18} color="#4a5568" />,
    roles: [RECRUIT_BASE_ROLE.Admin],
  },
  {
    path: generalUrl,
    name: "General Settings",
    icon: <FaCog size={18} color="#4a5568" />,
    roles: [RECRUIT_BASE_ROLE.Admin],
  },
  {
    path: activityUrl,
    name: "Activity Logs",
    icon: <FaHistory size={18} color="#4a5568" />,
    roles: [RECRUIT_BASE_ROLE.Admin],
  },
];