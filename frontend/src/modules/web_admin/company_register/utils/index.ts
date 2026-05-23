export const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");
export const safeStr = (v?: string | null) => v ?? "";

export const todayDateInput = () => new Date().toISOString().slice(0, 10);

export const normalizeVNPhone = (value: string) => {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.startsWith("84")) return "0" + digits.slice(2);
  if (digits.startsWith("0")) return digits;
  return digits;
};