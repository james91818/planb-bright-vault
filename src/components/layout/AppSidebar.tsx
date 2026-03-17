import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Settings, LogOut, Shield, UserCheck } from "lucide-react";

const AppSidebar = () => {
  const { profile, role, hasPermission, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", show: true },
    { label: "Users", icon: Users, path: "/users", show: hasPermission("users.manage") },
    { label: "Teams", icon: UserCheck, path: "/teams", show: hasPermission("users.manage") || role === "Manager" },
    { label: "Roles & Permissions", icon: Shield, path: "/admin/settings/roles", show: hasPermission("roles.manage") },
    { label: "Settings", icon: Settings, path: "/settings", show: hasPermission("settings.view") },
  ].filter((item) => item.show);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <Shield className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-bold text-sidebar-foreground">PlanB Trading</span>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === item.path
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-3">
          <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || profile?.email}</p>
          <p className="text-xs text-muted-foreground">{role || "No role"}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default AppSidebar;
