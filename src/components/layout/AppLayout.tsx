import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useAuth } from "@/hooks/useAuth";
import ThemePickerDialog from "@/components/ThemePickerDialog";

const AppLayout = () => {
  const { user, loading } = useAuth();
  const [showThemePicker, setShowThemePicker] = useState(false);

  useEffect(() => {
    if (user && !localStorage.getItem("planb-theme-chosen")) {
      setShowThemePicker(true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
        <MobileBottomNav />
      </SidebarInset>
      <ThemePickerDialog open={showThemePicker} onClose={() => setShowThemePicker(false)} />
    </SidebarProvider>
  );
};

export default AppLayout;
