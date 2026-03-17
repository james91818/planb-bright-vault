import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Wallet, LineChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { title: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Trade", icon: TrendingUp, path: "/trading" },
  { title: "Wallet", icon: Wallet, path: "/wallet" },
  { title: "Markets", icon: LineChart, path: "/watchlist" },
  { title: "More", icon: Settings, path: "/settings" },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="font-medium">{tab.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
