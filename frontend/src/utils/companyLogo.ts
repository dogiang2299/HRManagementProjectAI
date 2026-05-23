import { BASE_URL } from "../constant/config";

const getApiOrigin = () => {
  if (!BASE_URL) return "";

  try {
    return new URL(BASE_URL).origin;
  } catch {
    return "";
  }
};

export const resolveCompanyLogoUrl = (value?: string | null): string | undefined => {
  const raw = (value || "").trim();
  if (!raw) return undefined;

  const normalizedRaw = raw.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalizedRaw) || normalizedRaw.startsWith("data:")) {
    return normalizedRaw;
  }

  const normalizedPath = normalizedRaw.startsWith("/")
    ? normalizedRaw
    : normalizedRaw.startsWith("uploads/") || normalizedRaw.startsWith("upload/")
      ? `/${normalizedRaw}`
      : `/uploads/logo/${normalizedRaw}`;
  const origin = getApiOrigin();

  return origin ? `${origin}${normalizedPath}` : normalizedPath;
};
