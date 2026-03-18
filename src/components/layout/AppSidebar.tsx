import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronsLeft,
  Sun,
  Moon,
  LayoutDashboard,
  TrendingUp,
  Wallet,
  LineChart,
  Landmark,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Users,
  UserCheck,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Newspaper,
  Globe,
  Handshake,
  Copy,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";

const clientNav = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Trading", icon: TrendingUp, path: "/trading" },
  { title: "Wallet", icon: Wallet, path: "/wallet" },
  { title: "Staking", icon: Landmark, path: "/staking" },
  { title: "Copy Trading", icon: Copy, path: "/copy-trading" },
  { title: "Watchlist", icon: LineChart, path: "/watchlist" },
];

const adminNav = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Leads", icon: Users, path: "/admin/users" },
  { title: "Depositors", icon: UserCheck, path: "/admin/depositors" },
  { title: "Balance", icon: Wallet, path: "/admin/balance" },
  { title: "Agents", icon: Shield, path: "/admin/agents" },
  { title: "Affiliates", icon: Handshake, path: "/admin/affiliates", adminOnly: true },
  { title: "Deposits", icon: ArrowUpRight, path: "/admin/deposits" },
  { title: "Withdrawals", icon: ArrowDownRight, path: "/admin/withdrawals" },
  { title: "Trades", icon: TrendingUp, path: "/admin/trades" },
  { title: "Staking", icon: Landmark, path: "/admin/staking" },
  
  { title: "News", icon: Newspaper, path: "/admin/news" },
  
];

const bottomNav = [
  { title: "Notifications", icon: Bell, path: "/notifications" },
  { title: "Support", icon: HelpCircle, path: "/support" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isStaff, roleName } = useRole();
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === "collapsed";
  const { theme, toggleTheme } = useTheme();
  const [balance, setBalance] = useState<number | null>(null);

  const mainNav = isStaff
    ? adminNav.filter(item => !(item as any).adminOnly || roleName === "Admin")
    : clientNav;

  // Fetch EUR balance for clients
  useEffect(() => {
    if (!user || isStaff) return;
    const fetchBalance = async () => {
      const { data } = await supabase
        .from("wallets").select("balance")
        .eq("user_id", user.id).eq("currency", "EUR").maybeSingle();
      if (data) setBalance(Number(data.balance));
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [user, isStaff]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            {isStaff ? (
              <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
            ) : (
              <TrendingUp className="h-5 w-5 text-sidebar-primary-foreground" />
            )}
          </div>
          <div>
            <span className="text-lg font-display font-bold text-sidebar-primary-foreground">
              PlanB Trading
            </span>
            {isStaff && (
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Backoffice</p>
            )}
          </div>
        </div>
        {!isStaff && balance !== null && !collapsed && (
          <div className="mt-3 rounded-lg bg-sidebar-accent px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50 font-medium">Total Balance</p>
            <p className="text-lg font-display font-bold text-sidebar-primary-foreground">
              €{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </SidebarHeader>

      {/* Collapse toggle button */}
      <div className="hidden md:flex px-3 pb-1">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <ChevronsLeft className={`h-4 w-4 shrink-0 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isStaff ? "Administration" : "Menu"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNav.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    onClick={() => navigate(item.path)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={theme === "light" ? "Dark Mode" : "Light Mode"}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate("/")} tooltip="Back to Website">
              <Globe className="h-4 w-4" />
              <span>Back to Website</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
