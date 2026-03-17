import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Ban, CheckCircle, DollarSign, TrendingUp, Wallet, Shield, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-destructive/10 text-destructive",
  pending: "bg-yellow-500/10 text-yellow-600",
};

const AdminUserDetail = () => {
  const { user: currentUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [userRoleId, setUserRoleId] = useState<string>("none");
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editProfile, setEditProfile] = useState({ full_name: "", phone: "", country: "", kyc_status: "" });
  const [adminNotes, setAdminNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");

  const fetchAll = async () => {
    if (!userId) return;
    const [
      { data: prof },
      { data: rolesData },
      { data: urData },
      { data: deps },
      { data: wds },
      { data: trs },
      { data: wals },
      { data: notes },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("roles").select("*"),
      supabase.from("user_roles").select("user_id, role_id, roles(name)").eq("user_id", userId),
      supabase.from("deposits").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", userId).order("opened_at", { ascending: false }).limit(50),
      supabase.from("wallets").select("*").eq("user_id", userId),
      supabase.from("admin_notes").select("*, profiles!admin_notes_author_id_fkey(full_name, email)").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);

    setProfile(prof);
    setRoles(rolesData ?? []);
    setUserRoleId((urData && urData.length > 0) ? urData[0].role_id : "none");
    setDeposits(deps ?? []);
    setWithdrawals(wds ?? []);
    setTrades(trs ?? []);
    setWallets(wals ?? []);
    setAdminNotes(notes ?? []);

    if (prof) {
      setEditProfile({
        full_name: prof.full_name ?? "",
        phone: prof.phone ?? "",
        country: prof.country ?? "",
        kyc_status: prof.kyc_status ?? "not_submitted",
      });
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [userId]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await supabase.from("profiles").update(editProfile).eq("id", userId);
    toast.success("Profile updated");
    setSaving(false);
    fetchAll();
  };

  const updateStatus = async (status: string) => {
    await supabase.from("profiles").update({ status }).eq("id", userId);
    toast.success(`User ${status === "suspended" ? "suspended" : "activated"}`);
    fetchAll();
  };

  const assignRole = async (roleId: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId!);
    if (roleId !== "none") {
      await supabase.from("user_roles").insert({ user_id: userId!, role_id: roleId });
    }
    setUserRoleId(roleId);
    toast.success("Role updated");
  };

  const updateWalletBalance = async (walletId: string, newBalance: number) => {
    await supabase.from("wallets").update({ balance: newBalance }).eq("id", walletId);
    toast.success("Wallet balance updated");
    fetchAll();
  };

  const submitNote = async () => {
    if (!currentUser || !userId || !newNote.trim()) return;
    await supabase.from("admin_notes").insert({
      user_id: userId,
      author_id: currentUser.id,
      content: newNote.trim(),
    });
    setNewNote("");
    toast.success("Note added");
    fetchAll();
  };

  const totalDeposited = deposits.filter(d => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0);
  const totalWithdrawn = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
  const totalPnl = trades.filter(t => t.status === "closed").reduce((s, t) => s + Number(t.pnl ?? 0), 0);
  const openTradesCount = trades.filter(t => t.status === "open").length;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading user...</div>;
  }

  if (!profile) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">User not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">{profile.full_name || profile.email}</h1>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColors[profile.status] ?? "bg-muted text-muted-foreground"}`}>
          {profile.status}
        </span>
        <Badge variant={profile.is_lead ? "secondary" : "default"} className="text-xs">
          {profile.is_lead ? "Lead" : "Depositor"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Deposited</p>
              <p className="text-lg font-display font-bold">€{totalDeposited.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Withdrawn</p>
              <p className="text-lg font-display font-bold">€{totalWithdrawn.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total P&L</p>
              <p className={`text-lg font-display font-bold ${totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
                €{totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open Trades</p>
              <p className="text-lg font-display font-bold">{openTradesCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="deposits">Deposits ({deposits.length})</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals ({withdrawals.length})</TabsTrigger>
          <TabsTrigger value="trades">Trades ({trades.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({adminNotes.length})</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Edit Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={editProfile.full_name} onChange={e => setEditProfile({ ...editProfile, full_name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={editProfile.phone} onChange={e => setEditProfile({ ...editProfile, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Country</Label>
                  <Input value={editProfile.country} onChange={e => setEditProfile({ ...editProfile, country: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>KYC Status</Label>
                  <Select value={editProfile.kyc_status} onValueChange={v => setEditProfile({ ...editProfile, kyc_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_submitted">Not Submitted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Account Controls</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label>Role</Label>
                  <Select value={userRoleId} onValueChange={assignRole}>
                    <SelectTrigger><SelectValue placeholder="No role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No role</SelectItem>
                      {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 pt-4">
                  <Label>Status Actions</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-success border-success/30 hover:bg-success/10" onClick={() => updateStatus("active")}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Activate
                    </Button>
                    <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateStatus("suspended")}>
                      <Ban className="h-4 w-4 mr-2" /> Suspend
                    </Button>
                  </div>
                </div>
                <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between"><span>Joined</span><span>{new Date(profile.created_at).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>2FA</span><span>{profile.two_factor_enabled ? "Enabled" : "Disabled"}</span></div>
                  <div className="flex justify-between"><span>Type</span><span>{profile.is_lead ? "Lead" : "Depositor"}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Currency</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Balance</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map(w => (
                    <WalletRow key={w.id} wallet={w} onUpdate={updateWalletBalance} />
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deposits Tab */}
        <TabsContent value="deposits">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No deposits</td></tr>
                  ) : deposits.map(d => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="p-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold">€{Number(d.amount).toLocaleString()}</td>
                      <td className="p-3 text-muted-foreground capitalize">{d.method}</td>
                      <td className="p-3"><Badge variant="outline" className="capitalize text-xs">{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Method</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No withdrawals</td></tr>
                  ) : withdrawals.map(w => (
                    <tr key={w.id} className="border-b last:border-0">
                      <td className="p-3 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold">€{Number(w.amount).toLocaleString()}</td>
                      <td className="p-3 text-muted-foreground capitalize">{w.method}</td>
                      <td className="p-3"><Badge variant="outline" className="capitalize text-xs">{w.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trades Tab */}
        <TabsContent value="trades">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium text-muted-foreground">Asset</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Direction</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Size</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Entry</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">P&L</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.length === 0 ? (
                      <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No trades</td></tr>
                    ) : trades.map(t => (
                      <tr key={t.id} className="border-b last:border-0">
                        <td className="p-3 font-medium">{(t.assets as any)?.symbol ?? "—"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-xs capitalize ${t.direction === "buy" ? "text-success" : "text-destructive"}`}>
                            {t.direction}
                          </Badge>
                        </td>
                        <td className="p-3">€{Number(t.size).toLocaleString()}</td>
                        <td className="p-3">{Number(t.entry_price).toLocaleString()}</td>
                        <td className={`p-3 font-semibold ${Number(t.pnl ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                          €{Number(t.pnl ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3"><Badge variant="outline" className="text-xs capitalize">{t.status}</Badge></td>
                        <td className="p-3 text-muted-foreground text-xs">{new Date(t.opened_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* Inline wallet row with editable balance */
const WalletRow = ({ wallet, onUpdate }: { wallet: any; onUpdate: (id: string, bal: number) => void }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(wallet.balance));

  return (
    <tr className="border-b last:border-0">
      <td className="p-3 font-medium">{wallet.currency}</td>
      <td className="p-3">
        {editing ? (
          <Input type="number" value={val} onChange={e => setVal(e.target.value)} className="w-32 h-8 text-sm" autoFocus />
        ) : (
          <span className="font-semibold">{Number(wallet.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        )}
      </td>
      <td className="p-3 text-right">
        {editing ? (
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { onUpdate(wallet.id, Number(val)); setEditing(false); }}>Save</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => { setVal(String(wallet.balance)); setEditing(true); }}>Edit</Button>
        )}
      </td>
    </tr>
  );
};

export default AdminUserDetail;
