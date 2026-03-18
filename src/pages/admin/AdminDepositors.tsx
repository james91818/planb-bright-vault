import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, DollarSign, Phone, Eye, Ban, Mail, KeyRound, Send, LogIn } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusChanger from "@/components/admin/StatusChanger";
import { useNavigate } from "react-router-dom";
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

  const filtered = depositors.filter(u =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search depositors..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Phone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Country</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Registration</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">First Deposit</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Affiliate</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Funnel</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Agent</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Deposits</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Balance</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Last Note</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">#Notes</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={16} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={16} className="p-8 text-center text-muted-foreground">No depositors found</td></tr>
                ) : (
                  filtered.map(u => {
                    const note = notesMap[u.id];
                    return (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>
                        <td className="p-3">
                          <p className="font-medium whitespace-nowrap">{u.full_name || "—"}</p>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground whitespace-nowrap">{u.phone || "—"}</span>
                            {u.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${u.phone}`, "_self");
                                }}
                              >
                                <Phone className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{u.email || "—"}</td>
                        <td className="p-3 text-muted-foreground">{u.country || "—"}</td>
                        <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                          {new Date(u.created_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })}
                        </td>
                        <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                          {u.first_deposit_at ? new Date(u.first_deposit_at).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—"}
                        </td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">{u.affiliate || "—"}</td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">{u.funnel || "—"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">{u.deposit_count}</Badge>
                        </td>
                        <td className="p-3 font-semibold text-success whitespace-nowrap">€{u.total_deposited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="p-3 whitespace-nowrap">€{u.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-3">
                          <StatusChanger userId={u.id} currentStatus={u.status} onStatusChanged={fetchData} />
                        </td>
                        <td className="p-3">
                          <p className="text-xs text-muted-foreground max-w-[160px] truncate">
                            {note?.content || "—"}
                          </p>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className="text-xs">{note?.count ?? 0}</Badge>
                        </td>
                        <td className="p-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem onClick={() => navigate(`/admin/users/${u.id}`)}>
                                <Eye className="h-4 w-4 mr-2" /> View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/deposits?user=${u.id}`)}>
                                <DollarSign className="h-4 w-4 mr-2" /> View Deposits
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/withdrawals?user=${u.id}`)}>
                                <DollarSign className="h-4 w-4 mr-2" /> View Withdrawals
                              </DropdownMenuItem>
                              {u.email && (
                                <DropdownMenuItem onClick={() => window.open(`mailto:${u.email}`)}>
                                  <Mail className="h-4 w-4 mr-2" /> Send Email
                                </DropdownMenuItem>
                              )}
                              {u.phone && (
                                <DropdownMenuItem onClick={() => window.open(`tel:${u.phone}`, "_self")}>
                                  <Phone className="h-4 w-4 mr-2" /> Call
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openPasswordDialog(u.id, u.full_name || u.email)}>
                                <KeyRound className="h-4 w-4 mr-2" /> Change Password
                              </DropdownMenuItem>
                              {u.email && (
                                <DropdownMenuItem onClick={() => handleSendResetLink(u.id, u.email)}>
                                  <Send className="h-4 w-4 mr-2" /> Send Reset Link
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleLoginAsClient(u.id)}>
                                <LogIn className="h-4 w-4 mr-2" /> Login as Client
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => updateStatus(u.id, "active")}>
                                Set Active
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateStatus(u.id, "suspended")} className="text-destructive">
                                <Ban className="h-4 w-4 mr-2" /> Suspend
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
