import { useAuthStore } from "../store/auth.store";

interface AccessControlProps {
    allow: string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}
export const AccessControl: React.FC<AccessControlProps> = ({
    allow, children, fallback = null
}) => {
    const {user} = useAuthStore();
    const userRole = user?.roles?.[0]?.role?.role_code;

    if(!userRole || !allow.includes(userRole)){
        return <>{fallback}</>
    }
    return<>{children}</>
}