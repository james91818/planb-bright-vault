import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const { profile, role } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {profile?.full_name || "User"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You are signed in as <span className="font-medium text-foreground">{role || "Unassigned"}</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
