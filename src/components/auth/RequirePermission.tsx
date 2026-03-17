import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const RequirePermission: React.FC<RequirePermissionProps> = ({ permission, children, fallback }) => {
  const { hasPermission, loading } = useAuth();

  if (loading) return null;

  if (!hasPermission(permission)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RequirePermission;
