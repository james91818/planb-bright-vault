import { Navigate, Outlet } from "react-router-dom";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  allowedRoles?: string[];
  requireStaff?: boolean;
}

const ProtectedRoute = ({ allowedRoles, requireStaff }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isStaff, roleName, loading: roleLoading } = useRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requireStaff && !isStaff) return <Navigate to="/dashboard" replace />;

  if (allowedRoles && roleName && !allowedRoles.includes(roleName)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !roleName) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
