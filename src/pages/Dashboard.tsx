import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import ClientDashboard from "./ClientDashboard";
import AdminDashboard from "./AdminDashboard";

const Dashboard = () => {
  const { loading: authLoading } = useAuth();
  const { isStaff, loading: roleLoading } = useRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return isAdmin ? <AdminDashboard /> : <ClientDashboard />;
};

export default Dashboard;
