import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, DollarSign, Phone, Eye, Ban, Mail, KeyRound, Send, LogIn } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusChanger from "@/components/admin/StatusChanger";
import { useNavigate } from "react-router-dom";
import DepositorsTable from "@/components/admin/DepositorsTable";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


const FIAT_CURRENCIES = ["EUR", "USD", "GBP", "CHF", "AUD", "CAD"];
const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin", ETH: "ethereum", SOL: "solana", XRP: "ripple",
  BNB: "binancecoin", ADA: "cardano", DOGE: "dogecoin", DOT: "polkadot",
  LINK: "chainlink", AVAX: "avalanche-2",
};

const AdminDepositors = () => {
  const navigate = useNavigate();
  const [depositors, setDepositors] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [countryFilter, setCountryFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const [affiliateFilter, setAffiliateFilter] = useState("all");
  const [funnelFilter, setFunnelFilter] = useState("all");
  const [notesMap, setNotesMap] = useState<Record<string, { content: string; created_at: string; count: number }>>({});
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [pwUserId, setPwUserId] = useState("");
  const [pwUserName, setPwUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [cryptoPricesEur, setCryptoPricesEur] = useState<Record<string, number>>({});

  // Fetch live crypto prices
  useEffect(() => {
    const ids = Object.values(CRYPTO_IDS).join(",");
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`)
      .then(r => r.json())
      .then(data => {
        const map: Record<string, number> = {};
        for (const [symbol, cgId] of Object.entries(CRYPTO_IDS)) {
          if (data[cgId]?.eur) map[symbol] = data[cgId].eur;
        }
        setCryptoPricesEur(map);
      })
      .catch(() => {});
  }, []);

  const fetchData = async () => {
    const [{ data: profiles }, { data: urData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id"),
    ]);

    const staffIds = new Set((urData ?? []).map((ur: any) => ur.user_id));
    const agentProfiles = (profiles ?? []).filter(p => staffIds.has(p.id));
    setAgents(agentProfiles);

    const depositorProfiles = (profiles ?? []).filter(p => !staffIds.has(p.id) && p.is_lead === false);

    if (!depositorProfiles || depositorProfiles.length === 0) {
      setDepositors([]);
      setLoading(false);
      return;
    }

    const userIds = depositorProfiles.map(p => p.id);

    const [{ data: deposits }, { data: wallets }, { data: notes }] = await Promise.all([
      supabase.from("deposits").select("user_id, amount, status, currency").eq("status", "approved").in("user_id", userIds),
      supabase.from("wallets").select("user_id, balance, currency").in("user_id", userIds),
      supabase.from("admin_notes").select("user_id, content, created_at").in("user_id", userIds).order("created_at", { ascending: false }),
    ]);

    const depositTotals: Record<string, number> = {};
    const depositCounts: Record<string, number> = {};
    (deposits ?? []).forEach((d: any) => {
      const amt = Number(d.amount);
      let eurValue = amt;
      if (!FIAT_CURRENCIES.includes(d.currency)) {
        const price = cryptoPricesEur[d.currency];
        eurValue = price ? amt * price : amt;
      }
      depositTotals[d.user_id] = (depositTotals[d.user_id] ?? 0) + eurValue;
      depositCounts[d.user_id] = (depositCounts[d.user_id] ?? 0) + 1;
    });

    const balanceMap: Record<string, number> = {};
    (wallets ?? []).forEach((w: any) => {
      const balance = Number(w.balance);
      const eurValue = FIAT_CURRENCIES.includes(w.currency)
        ? balance
        : (cryptoPricesEur[w.currency] ? balance * cryptoPricesEur[w.currency] : balance);
      balanceMap[w.user_id] = (balanceMap[w.user_id] ?? 0) + eurValue;
    });

    const nMap: Record<string, { content: string; created_at: string; count: number }> = {};
    (notes ?? []).forEach((n: any) => {
      if (!nMap[n.user_id]) {
        nMap[n.user_id] = { content: n.content, created_at: n.created_at, count: 0 };
      }
      nMap[n.user_id].count += 1;
    });
    setNotesMap(nMap);

    const enriched = depositorProfiles.map(p => ({
      ...p,
      total_deposited: depositTotals[p.id] ?? 0,
      deposit_count: depositCounts[p.id] ?? 0,
      balance: balanceMap[p.id] ?? 0,
    }));

    setDepositors(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [cryptoPricesEur]);

  const assignAgent = async (userId: string, agentId: string | null) => {
    await supabase.from("profiles").update({ assigned_agent: agentId }).eq("id", userId);
    toast.success("Agent assigned");
    fetchData();
  };

  const updateStatus = async (userId: string, status: string) => {
    await supabase.from("profiles").update({ status }).eq("id", userId);
    toast.success(`User status updated to ${status}`);
    fetchData();
  };

  const openPasswordDialog = (userId: string, name: string) => {
    setPwUserId(userId);
    setPwUserName(name);
    setNewPassword("");
    setPwDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "change_password", user_id: pwUserId, password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Password changed successfully");
      setPwDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  const handleSendResetLink = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "send_reset_link", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Password reset link sent to ${email}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    }
  };

  const handleLoginAsClient = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "login_as_client", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Opening client session in new tab");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to login as client");
    }
  };

  const uniqueCountries = [...new Set(depositors.map(u => u.country).filter(Boolean))].sort();
  const uniqueAffiliates = [...new Set(depositors.map(u => u.affiliate).filter(Boolean))].sort();
  const uniqueFunnels = [...new Set(depositors.map(u => u.funnel).filter(Boolean))].sort();

  const filtered = depositors.filter(u => {
    const matchesSearch =
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === "all" || u.country === countryFilter;
    const matchesAgent = agentFilter === "all" || (agentFilter === "none" ? !u.assigned_agent : u.assigned_agent === agentFilter);
    const matchesAffiliate = affiliateFilter === "all" || (affiliateFilter === "none" ? !u.affiliate : u.affiliate === affiliateFilter);
    const matchesFunnel = funnelFilter === "all" || (funnelFilter === "none" ? !u.funnel : u.funnel === funnelFilter);
    return matchesSearch && matchesCountry && matchesAgent && matchesAffiliate && matchesFunnel;
  });

  const totalDeposited = depositors.reduce((sum, d) => sum + d.total_deposited, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Depositors</h1>
        <p className="text-muted-foreground text-sm">
          {depositors.length} depositors · €{totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total deposited
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Depositors</p>
              <p className="text-xl font-display font-bold">{depositors.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Deposited</p>
              <p className="text-xl font-display font-bold">€{totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Deposit</p>
              <p className="text-xl font-display font-bold">
                €{depositors.length > 0 ? Math.round(totalDeposited / depositors.length).toLocaleString() : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search depositors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {uniqueCountries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            <SelectItem value="none">Unassigned</SelectItem>
            {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name || a.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={affiliateFilter} onValueChange={setAffiliateFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Affiliates</SelectItem>
            <SelectItem value="none">No Affiliate</SelectItem>
            {uniqueAffiliates.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={funnelFilter} onValueChange={setFunnelFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funnels</SelectItem>
            <SelectItem value="none">No Funnel</SelectItem>
            {uniqueFunnels.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DepositorsTable
        loading={loading}
        filtered={filtered}
        notesMap={notesMap}
        agents={agents}
        navigate={navigate}
        assignAgent={assignAgent}
        fetchData={fetchData}
        openPasswordDialog={openPasswordDialog}
        handleSendResetLink={handleSendResetLink}
        handleLoginAsClient={handleLoginAsClient}
        updateStatus={updateStatus}
      />

      {/* Change Password Dialog */}
      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password — {pwUserName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={pwLoading}>
              {pwLoading ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDepositors;
