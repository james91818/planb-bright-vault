import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Wallet, Activity, ArrowUpRight, ArrowDownRight,
  Landmark, LineChart, Plus, Send, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import btcIcon from "@/assets/crypto/btc.png";
import ethIcon from "@/assets/crypto/eth.png";
import solIcon from "@/assets/crypto/sol.png";
import xrpIcon from "@/assets/crypto/xrp.png";
import bnbIcon from "@/assets/crypto/bnb.png";
import dogeIcon from "@/assets/crypto/doge.png";
import adaIcon from "@/assets/crypto/ada.png";
import dotIcon from "@/assets/crypto/dot.png";
import linkIcon from "@/assets/crypto/link.png";
import avaxIcon from "@/assets/crypto/avax.png";

const CURRENCY_ICONS: Record<string, { type: "img"; src: string } | { type: "emoji"; src: string }> = {
  EUR: { type: "emoji", src: "🇪🇺" },
  USD: { type: "emoji", src: "🇺🇸" },
  GBP: { type: "emoji", src: "🇬🇧" },
  CHF: { type: "emoji", src: "🇨🇭" },
  AUD: { type: "emoji", src: "🇦🇺" },
  CAD: { type: "emoji", src: "🇨🇦" },
  BTC: { type: "img", src: btcIcon },
  ETH: { type: "img", src: ethIcon },
  SOL: { type: "img", src: solIcon },
  XRP: { type: "img", src: xrpIcon },
  BNB: { type: "img", src: bnbIcon },
  DOGE: { type: "img", src: dogeIcon },
  ADA: { type: "img", src: adaIcon },
  DOT: { type: "img", src: dotIcon },
  LINK: { type: "img", src: linkIcon },
  AVAX: { type: "img", src: avaxIcon },
};
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-1))",
];

const FIAT_CURRENCIES = ["EUR", "USD", "GBP", "CHF", "AUD", "CAD"];
const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  BNB: "binancecoin",
  DOGE: "dogecoin",
  ADA: "cardano",
  DOT: "polkadot",
  LINK: "chainlink",
  AVAX: "avalanche-2",
};

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<any[]>([]);
  const [openTrades, setOpenTrades] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [todayPnl, setTodayPnl] = useState(0);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [recentWithdrawals, setRecentWithdrawals] = useState<any[]>([]);
  const [watchlistAssets, setWatchlistAssets] = useState<any[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [cryptoPricesEur, setCryptoPricesEur] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = Object.values(CRYPTO_IDS).join(",");
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`)
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, number> = {};
        for (const [symbol, cgId] of Object.entries(CRYPTO_IDS)) {
          if (data[cgId]?.eur) map[symbol] = data[cgId].eur;
        }
        setCryptoPricesEur(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { data: wals },
        { data: trades },
        { data: closedToday },
        { data: deps },
        { data: wds },
        { data: wl },
        { data: priceData },
      ] = await Promise.all([
        supabase.from("wallets").select("balance, currency").eq("user_id", user.id),
        supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", user.id).order("opened_at", { ascending: false }).limit(20),
        supabase.from("trades").select("pnl").eq("user_id", user.id).eq("status", "closed").gte("closed_at", today.toISOString()),
        supabase.from("deposits").select("id, amount, currency, method, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("withdrawals").select("id, amount, currency, method, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("watchlist").select("asset_id, assets(symbol, name, type, icon_url)").eq("user_id", user.id).limit(8),
        supabase.from("price_cache").select("symbol, price"),
      ]);

      setWallets(wals ?? []);

      if (trades) {
        const open = trades.filter((t) => t.status === "open");
        setOpenTrades(open.length);
        setTotalPnl(open.reduce((sum, t) => sum + Number(t.pnl || 0), 0));
        setRecentTrades(trades.slice(0, 5));
      }

      setTodayPnl(closedToday?.reduce((sum, t) => sum + Number(t.pnl || 0), 0) ?? 0);
      setRecentDeposits(deps ?? []);
      setRecentWithdrawals(wds ?? []);
      setWatchlistAssets(wl ?? []);

      const priceMap: Record<string, number> = {};
      priceData?.forEach(p => { priceMap[p.symbol] = Number(p.price); });
      setPrices(priceMap);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const walletToEur = (wallet: any) => {
    const balance = Number(wallet.balance || 0);
    if (FIAT_CURRENCIES.includes(wallet.currency)) return balance;
    const rate = cryptoPricesEur[wallet.currency];
    return rate ? balance * rate : balance;
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + walletToEur(wallet), 0);
  const portfolioData = wallets
    .filter((wallet) => Number(wallet.balance) > 0)
    .map((wallet) => ({
      name: wallet.currency,
      value: walletToEur(wallet),
    }))
    .filter((wallet) => wallet.value > 0);

  const statusColors: Record<string, string> = {
    approved: "text-success",
    pending: "text-yellow-600",
    rejected: "text-destructive",
    open: "text-primary",
    closed: "text-muted-foreground",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your portfolio overview</p>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Deposit", icon: ArrowUpRight, path: "/wallet", color: "text-success" },
          { label: "Withdraw", icon: ArrowDownRight, path: "/wallet", color: "text-destructive" },
          { label: "Trade", icon: TrendingUp, path: "/trading", color: "text-primary" },
          { label: "Staking", icon: Landmark, path: "/staking", color: "text-chart-4" },
        ].map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto py-4 flex flex-col gap-1.5 hover:bg-muted/50"
            onClick={() => navigate(action.path)}
          >
            <action.icon className={`h-5 w-5 ${action.color}`} />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">€{totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">{wallets.length} currencies</p>
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
            <p className="text-xs text-muted-foreground">{openTrades} open positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Profit</CardTitle>
            {todayPnl >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-display font-bold ${todayPnl >= 0 ? "text-success" : "text-destructive"}`}>
              {todayPnl >= 0 ? "+" : ""}€{todayPnl.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Realized today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Trades</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold">{openTrades}</div>
            <p className="text-xs text-muted-foreground">Active positions</p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart + Market Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Portfolio Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {portfolioData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                <Wallet className="h-8 w-8 mb-2 text-muted-foreground/40" />
                No funds yet. Make your first deposit.
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={2}>
                        {portfolioData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `€${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {portfolioData.map((d, i) => {
                    const icon = CURRENCY_ICONS[d.name];
                    return (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {icon?.type === "img" ? (
                          <img src={icon.src} alt={d.name} className="h-4 w-4 rounded-full" />
                        ) : icon?.type === "emoji" ? (
                          <span className="text-sm leading-none">{icon.src}</span>
                        ) : null}
                        <span className="font-medium">{d.name}</span>
                      </div>
                      <span className="text-muted-foreground">€{d.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Watchlist / Market Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">My Watchlist</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/watchlist")}>
              <Eye className="h-4 w-4 mr-1" /> View All
            </Button>
          </CardHeader>
          <CardContent>
            {watchlistAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
                <LineChart className="h-8 w-8 mb-2 text-muted-foreground/40" />
                No watchlist items. Add assets from the Watchlist page.
              </div>
            ) : (
              <div className="space-y-3">
                {watchlistAssets.map((w) => {
                  const asset = (w as any).assets;
                  if (!asset) return null;
                  const price = prices[asset.symbol];
                  return (
                    <div key={w.asset_id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        {asset.icon_url && <img src={asset.icon_url} alt={asset.symbol} className="h-5 w-5 rounded-full" />}
                        <div>
                          <p className="font-medium text-sm">{asset.symbol}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{asset.type}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-sm">
                        {price ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades + Recent Transactions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Trades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Recent Trades</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/trading")}>View All</Button>
          </CardHeader>
          <CardContent>
            {recentTrades.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No trades yet. Start trading to see history.
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${trade.direction === "buy" ? "bg-success/10" : "bg-destructive/10"}`}>
                        {trade.direction === "buy" ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{(trade as any).assets?.symbol ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{trade.direction} · {trade.status}</p>
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

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-base">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/wallet")}>View All</Button>
          </CardHeader>
          <CardContent>
            {recentDeposits.length === 0 && recentWithdrawals.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                No transactions yet.
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  ...recentDeposits.map(d => ({ ...d, _type: "deposit" as const })),
                  ...recentWithdrawals.map(w => ({ ...w, _type: "withdrawal" as const })),
                ]
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 6)
                  .map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full ${tx._type === "deposit" ? "bg-success/10" : "bg-destructive/10"}`}>
                          {tx._type === "deposit" ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm capitalize">{tx._type}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{tx.method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {tx._type === "deposit" ? "+" : "-"}{tx.currency} {Number(tx.amount).toLocaleString()}
                          {!FIAT_CURRENCIES.includes(tx.currency) && cryptoPricesEur[tx.currency] ? ` · ≈ €${(Number(tx.amount) * cryptoPricesEur[tx.currency]).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                        </p>
                        <p className={`text-[10px] font-medium capitalize ${statusColors[tx.status] ?? "text-muted-foreground"}`}>
                          {tx.status}
                        </p>
                      </div>
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

export default ClientDashboard;
