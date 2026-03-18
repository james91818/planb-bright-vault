import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Shield, UserPlus, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalDepositsAmount: 0,
    totalWithdrawalsAmount: 0,
    openTrades: 0,
    recentUsers: [] as any[],
    recentDeposits: [] as any[],
    recentWithdrawals: [] as any[],
    todaySignups: 0,
    todayDeposits: 0,
    todayDepositAmount: 0,
    todayWithdrawals: 0,
    totalApprovedDeposits: 0,
    totalApprovedWithdrawals: 0,
    totalRevenue: 0,
    leadsCount: 0,
    depositorsCount: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const [
        { count: totalUsers },
        { count: activeUsers },
        { data: pendingDeposits },
        { data: pendingWithdrawals },
        { count: openTrades },
        { data: recentUsers },
        { data: recentDeposits },
        { data: recentWithdrawals },
        { count: todaySignups },
        { data: todayDeps },
        { count: todayWithdrawals },
        { data: approvedDeposits },
        { data: approvedWithdrawals },
        { count: leadsCount },
        { count: depositorsCount },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("deposits").select("amount").eq("status", "pending"),
        supabase.from("withdrawals").select("amount").eq("status", "pending"),
        supabase.from("trades").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("profiles").select("id, full_name, email, created_at, status, is_lead").order("created_at", { ascending: false }).limit(5),
        supabase.from("deposits").select("id, amount, method, status, created_at, currency, profiles(full_name, email)").order("created_at", { ascending: false }).limit(5),
        supabase.from("withdrawals").select("id, amount, method, status, created_at, currency, profiles(full_name, email)").order("created_at", { ascending: false }).limit(5),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("deposits").select("amount").eq("status", "approved").gte("created_at", todayISO),
        supabase.from("withdrawals").select("*", { count: "exact", head: true }).gte("created_at", todayISO),
        supabase.from("deposits").select("amount").eq("status", "approved"),
        supabase.from("withdrawals").select("amount").eq("status", "approved"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_lead", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_lead", false),
      ]);

      const totalApprovedDep = (approvedDeposits ?? []).reduce((s, d) => s + Number(d.amount), 0);
      const totalApprovedWd = (approvedWithdrawals ?? []).reduce((s, w) => s + Number(w.amount), 0);

      setStats({
        totalUsers: totalUsers ?? 0,
        activeUsers: activeUsers ?? 0,
        pendingDeposits: pendingDeposits?.length ?? 0,
        pendingWithdrawals: pendingWithdrawals?.length ?? 0,
        totalDepositsAmount: pendingDeposits?.reduce((s, d) => s + Number(d.amount), 0) ?? 0,
        totalWithdrawalsAmount: pendingWithdrawals?.reduce((s, w) => s + Number(w.amount), 0) ?? 0,
        openTrades: openTrades ?? 0,
        recentUsers: recentUsers ?? [],
        recentDeposits: recentDeposits ?? [],
        recentWithdrawals: recentWithdrawals ?? [],
        todaySignups: todaySignups ?? 0,
        todayDeposits: (todayDeps ?? []).length,
        todayDepositAmount: (todayDeps ?? []).reduce((s, d) => s + Number(d.amount), 0),
        todayWithdrawals: todayWithdrawals ?? 0,
        totalApprovedDeposits: totalApprovedDep,
        totalApprovedWithdrawals: totalApprovedWd,
        totalRevenue: totalApprovedDep - totalApprovedWd,
        leadsCount: leadsCount ?? 0,
        depositorsCount: depositorsCount ?? 0,
      });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Platform overview & management</p>
      </div>

      {/* Today's Highlights */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Today's Signups</p>
                <p className="text-2xl font-display font-bold">{stats.todaySignups}</p>
              </div>
              <UserPlus className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Today's Deposits</p>
                <p className="text-2xl font-display font-bold">{stats.todayDeposits}</p>
                <p className="text-xs text-success">€{stats.todayDepositAmount.toLocaleString()}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-success/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Withdrawals</p>
                <p className="text-2xl font-display font-bold">{stats.pendingWithdrawals}</p>
                <p className="text-xs text-destructive">€{stats.totalWithdrawalsAmount.toLocaleString()}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-destructive/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Net Revenue</p>
                <p className={`text-2xl font-display font-bold ${stats.totalRevenue >= 0 ? "text-success" : "text-destructive"}`}>
                  €{stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/admin/leads")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.totalUsers}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px]">{stats.leadsCount} leads</Badge>
              <Badge variant="default" className="text-[10px]">{stats.depositorsCount} depositors</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/admin/deposits")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Deposits</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.pendingDeposits}</div>
            <p className="text-xs text-muted-foreground">€{stats.totalDepositsAmount.toLocaleString()} awaiting</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/admin/withdrawals")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Withdrawals</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.pendingWithdrawals}</div>
            <p className="text-xs text-muted-foreground">€{stats.totalWithdrawalsAmount.toLocaleString()} awaiting</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate("/admin/trades")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Trades</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.openTrades}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Users */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center justify-between">
              Recent Signups
              <Badge variant="outline" className="text-[10px] font-normal cursor-pointer" onClick={() => navigate("/admin/leads")}>View all</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No users yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-1.5 border-b last:border-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded" onClick={() => navigate(`/admin/users/${u.id}`)}>
                    <div>
                      <p className="font-medium text-sm">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={u.is_lead ? "secondary" : "default"} className="text-[9px]">
                        {u.is_lead ? "Lead" : "Depositor"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deposits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center justify-between">
              Recent Deposits
              <Badge variant="outline" className="text-[10px] font-normal cursor-pointer" onClick={() => navigate("/admin/deposits")}>View all</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentDeposits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No deposits yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentDeposits.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{d.currency} {Number(d.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{d.profiles?.full_name || d.profiles?.email || "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      d.status === "approved" ? "bg-success/10 text-success" :
                      d.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Withdrawals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center justify-between">
              Recent Withdrawals
              <Badge variant="outline" className="text-[10px] font-normal cursor-pointer" onClick={() => navigate("/admin/withdrawals")}>View all</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentWithdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No withdrawals yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentWithdrawals.map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{w.currency} {Number(w.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{w.profiles?.full_name || w.profiles?.email || "—"}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      w.status === "approved" ? "bg-success/10 text-success" :
                      w.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
