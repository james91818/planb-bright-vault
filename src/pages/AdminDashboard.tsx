import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, ArrowUpRight, ArrowDownRight, Activity, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
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
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: totalUsers },
        { count: activeUsers },
        { data: pendingDeposits },
        { data: pendingWithdrawals },
        { count: openTrades },
        { data: recentUsers },
        { data: recentDeposits },
        { data: recentWithdrawals },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("deposits").select("amount").eq("status", "pending"),
        supabase.from("withdrawals").select("amount").eq("status", "pending"),
        supabase.from("trades").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("profiles").select("id, full_name, email, created_at, status").order("created_at", { ascending: false }).limit(5),
        supabase.from("deposits").select("id, amount, method, status, created_at, currency").order("created_at", { ascending: false }).limit(5),
        supabase.from("withdrawals").select("id, amount, method, status, created_at, currency").order("created_at", { ascending: false }).limit(5),
      ]);

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
      });
    };

    fetchStats();
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Deposits</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.pendingDeposits}</div>
            <p className="text-xs text-muted-foreground">€{stats.totalDepositsAmount.toLocaleString()} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Withdrawals</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{stats.pendingWithdrawals}</div>
            <p className="text-xs text-muted-foreground">€{stats.totalWithdrawalsAmount.toLocaleString()} total</p>
          </CardContent>
        </Card>

        <Card>
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

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No users yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{u.full_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                      {u.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Deposits */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Recent Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentDeposits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No deposits yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentDeposits.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{d.currency} {Number(d.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground capitalize">{d.method}</p>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
