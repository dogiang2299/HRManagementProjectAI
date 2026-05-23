import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IEmployee } from '../../web_admin/employee/types';

interface AuthState {
  accessToken: string | null;
  user: IEmployee | null;
  isAuthenticated: boolean;

  login: (token: string, user: IEmployee) => void;
  logout: () => void;
  
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => {
        set({
          accessToken: token,
          user: user,
          isAuthenticated: true,
        });
      },

      logout: () => {
  set({
    accessToken: null,
    user: null,
    isAuthenticated: false,
  });
  localStorage.removeItem('auth-storage');
},
      hasRole: (role) => {
        const { hasAnyRole } = get();
        return hasAnyRole([role]);
      },

      hasAnyRole: (allowedRoles) => {
  const { user } = get();
  if (!user?.roles) return false;

  const allowed = allowedRoles.map((x) => x.toLowerCase());
  const list = Array.isArray(user.roles) ? user.roles : [];

  const roleNames = list
    .map((r: any) => {
      if (typeof r === 'string') return r;
      return r?.role?.name_role || r?.name_role || r?.name || '';
    })
    .filter(Boolean)
    .map((x: string) => x.toLowerCase());

  return roleNames.some((r) => allowed.includes(r));
}
    }),
    {
      name: 'auth-storage', 
      storage: createJSONStorage(() => localStorage),
    }
  )
);