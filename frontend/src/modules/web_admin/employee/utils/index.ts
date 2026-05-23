export const getAuthUser = () => {
  try {
    const storage = localStorage.getItem("auth-storage");
    if (!storage) return null;
    const parsed = JSON.parse(storage);
    return parsed?.state?.user || null;
  } catch (error) {
    console.error("Failed to parse auth storage", error);
    return null;
  }
};

export const getRoleName = (r: any): string => {
  if (!r) return "";
  if (typeof r === "string") return r;

  if (typeof r.role === "string") return r.role;
  if (r.role?.name_role) return r.role.name_role;

  if (r.role_name) return r.role_name;
  if (r.name_role) return r.name_role;
  if (r.name) return r.name;

  return "";
};

export const getRoleNames = (roles: any): string[] => {
  const list = Array.isArray(roles) ? roles : [];
  return list.map(getRoleName).filter(Boolean);
};