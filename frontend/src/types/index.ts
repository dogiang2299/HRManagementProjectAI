import dayjs from "dayjs";

export type MenuMode = "main" | "admin";

export const formatDateShort = (value?: string | Date | null) => {
  if (!value) return "-";
  return dayjs(value).format("DD-MMM-YYYY");
};

export const formatCompactMoney = (value?: number | null, currency?: string | null) => {
  const v = value ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M ${currency ?? ""}`.trim();
  if (v >= 1_000) return `${Math.round(v / 1_000)}K ${currency ?? ""}`.trim();
  return `${v} ${currency ?? ""}`.trim();
};

export const daysLeft = (value?: string | Date | null): number | null => {
  if (!value) return null;

  const d = dayjs(value);
  if (!d.isValid()) return null;

  const today = dayjs().startOf("day");
  const target = d.startOf("day");
  return target.diff(today, "day");
};

export const formatDeadlineBadge = (value?: string | Date | null) => {
  const left = daysLeft(value);
  if (left == null) return "-";
  if (left < 0) return `Overdue ${Math.abs(left)}d`;
  return `D-${left}`;
};

export function getInitials (names: string){
  const n = (names ?? "").trim();

  if(!n) return "NA";

  const parts = n.split(/\s+/);

  const first = parts[0][0];
  const last = parts.length > 1 ?parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase();
}

export function formatMonth(value?: string | Date) {
  if (!value) return "";

  const date = new Date(value);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(date);
}