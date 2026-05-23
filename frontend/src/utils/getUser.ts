export function getUserRoles(): string[] {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return [];
  
    try {
      const outer = JSON.parse(raw);
  
      const state = typeof outer.state === "string"
        ? JSON.parse(outer.state)
        : outer.state;
  
      const roles = state?.user?.roles;
  
      if (Array.isArray(roles)) return roles;
      if (typeof roles === "string") return [roles];
  
      return [];
    } catch (error) {
      console.error("Roles not found", error);
      return [];
    }
  }
