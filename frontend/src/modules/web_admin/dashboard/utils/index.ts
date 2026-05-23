import type { ReportTabKey } from "../types";
import type { IconType } from "react-icons";
import {
  FiGrid,
  FiTrendingUp,
  FiDollarSign,
  FiCalendar,
  FiUserX,
  FiSettings,
} from "react-icons/fi";

type SidebarItem = {
  key: ReportTabKey;
  label: string;
  icon: IconType;
};

export const sibarItems: SidebarItem[] = [
  { key: "dashboard", label: "Overview", icon: FiGrid },
  { key: "performance", label: "Performance", icon: FiTrendingUp },
  { key: "cost", label: "Cost", icon: FiDollarSign },
  { key: "plan", label: "Planning", icon: FiCalendar },
  { key: "rejected", label: "Rejected Candidates", icon: FiUserX },
  // { key: "settings", label: "Data Configuration", icon: FiSettings },
];