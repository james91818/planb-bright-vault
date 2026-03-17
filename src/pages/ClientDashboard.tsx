import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ClientDashboard = () => {
  const { user } = useAuth();
  const [totalBalance, setTotalBalance] = useState(0);
  const [openTrades, setOpenTrades] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch wallet balances
      const { data: wallets } = await supabase
        .from("wallets")
        .select("balance, currency")
        .eq("user_id", user.id);
      if (wallets) {
        setTotalBalance(wallets.reduce((sum, w) => sum + Number(w.balance), 0));
      }

      // Fetch open trades
      const { data: trades } = await supabase
        .from("trades")
        .select("*, assets(symbol, name)")
        .eq("user_id", user.id)
        .order("opened_at", { ascending: false })
        .limit(10);
      if (trades) {
        const open = trades.filter((t) => t.status === "open");
        setOpenTrades(open.length);
        setTotalPnl(open.reduce((sum, t) => sum + Number(t.pnl || 0), 0));
        setRecentTrades(trades.slice(0, 5));
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your portfolio overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">€{totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open P&L</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-display font-bold ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
              {totalPnl >= 0 ? "+" : ""}€{totalPnl.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">From open positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">€0.00</div>
            <p className="text-xs text-muted-foreground">+0.0% today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Trades</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{openTrades}</div>
            <p className="text-xs text-muted-foreground">Active positions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No recent activity. Start trading to see your history here.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${trade.direction === "buy" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {trade.direction === "buy" ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{(trade as any).assets?.symbol ?? "—"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{trade.direction} · {trade.status}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">€{Number(trade.entry_price).toFixed(2)}</p>
                    <p className={`text-xs font-medium ${Number(trade.pnl) >= 0 ? "text-success" : "text-destructive"}`}>
                      {Number(trade.pnl) >= 0 ? "+" : ""}€{Number(trade.pnl || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;
