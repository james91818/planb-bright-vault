import { useState, useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useAuth } from "@/hooks/useAuth";
import ThemePickerDialog from "@/components/ThemePickerDialog";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";

const AppLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (user && !localStorage.getItem("planb-theme-chosen")) {
      setShowThemePicker(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const notifSound = new Audio("https://cdn.pixabay.com/audio/2022/12/12/audio_e8e16fbe70.mp3");
    notifSound.volume = 0.5;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      const newCount = count ?? 0;
      if (prevUnreadRef.current !== null && newCount > prevUnreadRef.current) {
        notifSound.play().catch(() => {});
      }
      prevUnreadRef.current = newCount;
      setUnreadCount(newCount);
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
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
          <button
            onClick={() => navigate("/notifications")}
            className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
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
