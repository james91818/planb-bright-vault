import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Wallet, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchLivePrices } from "@/lib/tradePnl";

interface UserBalance {
  id: string;
  full_name: string | null;
  email: string | null;
  is_lead: boolean | null;
  status: string | null;
  wallets: { currency: string; balance: number }[];
  totalEur: number;
}

const AdminBalance = () => {
  const [users, setUsers] = useState<UserBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  const cryptoSymbols = ["BTC/EUR", "ETH/EUR", "SOL/EUR", "XRP/EUR", "BNB/EUR", "DOGE/EUR", "ADA/EUR", "DOT/EUR", "LINK/EUR", "AVAX/EUR"];

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch prices for crypto conversion
    const prices = await fetchLivePrices(cryptoSymbols);
    setLivePrices(prices);

    // Fetch all profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, is_lead, status")
      .order("created_at", { ascending: false });

    // Fetch all wallets
    const { data: wallets } = await supabase
      .from("wallets")
      .select("user_id, currency, balance");

    const walletMap: Record<string, { currency: string; balance: number }[]> = {};
    for (const w of wallets ?? []) {
      if (!walletMap[w.user_id]) walletMap[w.user_id] = [];
      walletMap[w.user_id].push({ currency: w.currency, balance: Number(w.balance) });
    }

    const userList: UserBalance[] = (profiles ?? []).map((p) => {
      const userWallets = walletMap[p.id] ?? [];
      let totalEur = 0;
      for (const w of userWallets) {
        if (w.balance === 0) continue;
        if (w.currency === "EUR") {
          totalEur += w.balance;
        } else {
          // Try to convert crypto to EUR
          const sym = `${w.currency}/EUR`;
          const rate = prices[sym];
          if (rate) {
            totalEur += w.balance * rate;
          } else if (w.currency === "USD") {
            const eurUsd = prices["EUR/USD"];
            totalEur += eurUsd ? w.balance / eurUsd : w.balance;
          } else if (w.currency === "GBP") {
            const gbpUsd = prices["GBP/USD"];
            const eurUsd = prices["EUR/USD"];
            totalEur += gbpUsd && eurUsd ? (w.balance * gbpUsd) / eurUsd : w.balance;
          } else {
            totalEur += w.balance; // fallback
          }
        }
      }
      return {
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        is_lead: p.is_lead,
        status: p.status,
        wallets: userWallets,
        totalEur,
      };
    });

    setUsers(userList);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.full_name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q));
  });

  const leads = filtered.filter(u => u.is_lead !== false);
  const depositors = filtered.filter(u => u.is_lead === false);

  const formatEur = (n: number) => `€${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const renderTable = (list: UserBalance[]) => (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Wallets</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Total (EUR)</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found</td></tr>
            ) : list.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <div className="font-semibold text-sm">{u.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="p-3">
                  <Badge variant={u.status === "active" ? "default" : "secondary"} className="text-xs">
                    {u.status || "active"}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {u.wallets
                      .filter(w => w.balance !== 0)
                      .sort((a, b) => b.balance - a.balance)
                      .map(w => (
                        <Badge key={w.currency} variant="outline" className="text-xs font-mono">
                          {w.currency}: {w.balance < 1 ? w.balance.toFixed(6) : w.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Badge>
                      ))}
                    {u.wallets.filter(w => w.balance !== 0).length === 0 && (
                      <span className="text-xs text-muted-foreground">No balance</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right font-semibold font-mono">
                  {formatEur(u.totalEur)}
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/users/${u.id}`)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  const totalLeads = leads.reduce((s, u) => s + u.totalEur, 0);
  const totalDepositors = depositors.reduce((s, u) => s + u.totalEur, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Balance Overview
          </h1>
          <p className="text-muted-foreground text-sm mt-1">View all client balances across wallets</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Balance (All)</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-mono">{formatEur(totalLeads + totalDepositors)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Leads Balance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-mono">{formatEur(totalLeads)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Depositors Balance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-mono">{formatEur(totalDepositors)}</p></CardContent>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : (
        <Tabs defaultValue="depositors">
          <TabsList>
            <TabsTrigger value="depositors">Depositors ({depositors.length})</TabsTrigger>
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="depositors">{renderTable(depositors)}</TabsContent>
          <TabsContent value="leads">{renderTable(leads)}</TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminBalance;
