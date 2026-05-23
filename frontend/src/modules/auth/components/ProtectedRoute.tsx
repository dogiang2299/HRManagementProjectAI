// Chặn truy cập trái phép vào route; chưa đăng nhập hay sai quyền thì không cho vào
import type React from "react";
import { useAuthStore } from "../store/auth.store";
import { Navigate, Outlet } from "react-router-dom";
import { error403Url, loginUrl } from "../../../routes/urls";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { accessToken, user, hasAnyRole } = useAuthStore();

  if (!accessToken || !user) {
    return <Navigate to={loginUrl} replace />;
  }

  if(allowedRoles && !hasAnyRole(allowedRoles)){
    return <Navigate to={error403Url} replace/>
  }

  if (children) {
    return <>{children}</>;
  }

  return <Outlet />;
};

export default ProtectedRoute;