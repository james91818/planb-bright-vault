import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, MoreHorizontal, Plus, Phone, Shuffle, Eye, Mail, KeyRound, Send, Ban, LogIn } from "lucide-react";
import StatusChanger, { useLeadStatuses } from "@/components/admin/StatusChanger";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";



const AdminUsers = () => {
  const { user: authUser } = useAuth();
  const leadStatuses = useLeadStatuses();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [staffUserIds, setStaffUserIds] = useState<Set<string>>(new Set());
  const [agents, setAgents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", first_name: "", last_name: "", phone: "", country: "Germany", date_of_birth: "", address: "", city: "", postal_code: "", funnel: "" });
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositForm, setDepositForm] = useState({ user_id: "", amount: "", currency: "EUR", method: "manual", notes: "" });
  const [notesMap, setNotesMap] = useState<Record<string, { content: string; created_at: string; count: number }>>({});
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [pwUserId, setPwUserId] = useState("");
  const [pwUserName, setPwUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const fetchData = async () => {
    const [{ data: profiles }, { data: urData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role_id, roles(name)"),
    ]);
    const staffIds = new Set((urData ?? []).map((ur: any) => ur.user_id));
    setStaffUserIds(staffIds);

    // Build agents list from staff profiles
    const agentProfiles = (profiles ?? []).filter(p => staffIds.has(p.id));
    setAgents(agentProfiles);

    const clientProfiles = (profiles ?? []).filter(p => !staffIds.has(p.id) && p.is_lead !== false);
    setUsers(clientProfiles);

    // Fetch latest admin notes for all users
    if (clientProfiles.length > 0) {
      const { data: notes } = await supabase
        .from("admin_notes")
        .select("user_id, content, created_at")
        .in("user_id", clientProfiles.map(p => p.id))
        .order("created_at", { ascending: false });

      const map: Record<string, { content: string; created_at: string; count: number }> = {};
      (notes ?? []).forEach((n: any) => {
        if (!map[n.user_id]) {
          map[n.user_id] = { content: n.content, created_at: n.created_at, count: 0 };
        }
        map[n.user_id].count += 1;
      });
      setNotesMap(map);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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
    if (!newPassword || newPassword.length < 6) {
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

  const handleCreateUser = async () => {
    const fullName = `${newUser.first_name} ${newUser.last_name}`.trim();
    if (!newUser.email || !newUser.password || !fullName) {
      toast.error("Email, password, and name are required");
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: {
        data: {
          full_name: fullName,
          phone: newUser.phone,
          country: newUser.country,
        },
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    // Update profile with extra fields
    if (data.user) {
      await supabase.from("profiles").update({
        funnel: newUser.funnel || null,
      }).eq("id", data.user.id);
    }
    toast.success("User created successfully");
    setCreateOpen(false);
    setNewUser({ email: "", password: "", first_name: "", last_name: "", phone: "", country: "Germany", date_of_birth: "", address: "", city: "", postal_code: "", funnel: "" });
    setTimeout(fetchData, 1000);
  };

  const submitManualDeposit = async () => {
    if (!depositForm.user_id || !depositForm.amount || Number(depositForm.amount) <= 0) {
      toast.error("Select a user and enter a valid amount");
      return;
    }
    const amount = Number(depositForm.amount);

    const { error: depError } = await supabase.from("deposits").insert({
      user_id: depositForm.user_id,
      amount,
      currency: depositForm.currency,
      method: depositForm.method,
      status: "approved",
      admin_notes: depositForm.notes || "Manual deposit by admin",
      processed_by: authUser?.id,
    });

    if (depError) {
      toast.error("Failed to create deposit: " + depError.message);
      return;
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", depositForm.user_id)
      .eq("currency", depositForm.currency)
      .maybeSingle();

    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + amount }).eq("id", wallet.id);
    }

    if (amount >= 1) {
      await supabase.from("profiles").update({ is_lead: false }).eq("id", depositForm.user_id);
    }

    toast.success("Manual deposit created and credited");
    setDepositOpen(false);
    setDepositForm({ user_id: "", amount: "", currency: "EUR", method: "manual", notes: "" });
    fetchData();
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Leads</h1>
          <p className="text-muted-foreground text-sm">{users.length} total leads</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Create User
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {leadStatuses.map(s => (
              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <th className="text-left p-3 font-medium text-muted-foreground">Affiliate</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Funnel</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Last Note</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">#Notes</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No leads found</td></tr>
                ) : (
                  filtered.map((u) => {
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
                        <td className="p-3 text-muted-foreground whitespace-nowrap">{u.affiliate || "—"}</td>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">{u.funnel || "—"}</td>
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

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>First Name *</Label>
                <Input value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} placeholder="John" />
              </div>
              <div className="space-y-1">
                <Label>Last Name *</Label>
                <Input value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} placeholder="Doe" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div className="space-y-1">
                <Label>Password *</Label>
                <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min 6 characters" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} placeholder="+49 123 456 7890" />
              </div>
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input type="date" value={newUser.date_of_birth} onChange={(e) => setNewUser({ ...newUser, date_of_birth: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Country</Label>
                <Select value={newUser.country} onValueChange={(v) => setNewUser({ ...newUser, country: v })}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {["Germany", "Austria", "Switzerland", "United Kingdom", "France", "Netherlands", "Belgium", "Italy", "Spain", "Portugal", "Sweden", "Norway", "Denmark", "Finland", "Poland", "Czech Republic", "Ireland", "Luxembourg", "Greece", "Cyprus", "Malta", "Romania", "Bulgaria", "Croatia", "Hungary", "Slovakia", "Slovenia", "Estonia", "Latvia", "Lithuania", "United States", "Canada", "Australia", "New Zealand", "United Arab Emirates", "Saudi Arabia", "Turkey", "South Africa", "Brazil", "Mexico", "Japan", "South Korea", "Singapore", "Hong Kong", "India", "China"].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>City</Label>
                <Input value={newUser.city} onChange={(e) => setNewUser({ ...newUser, city: e.target.value })} placeholder="Berlin" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Address</Label>
                <Input value={newUser.address} onChange={(e) => setNewUser({ ...newUser, address: e.target.value })} placeholder="Street, Number" />
              </div>
              <div className="space-y-1">
                <Label>Postal Code</Label>
                <Input value={newUser.postal_code} onChange={(e) => setNewUser({ ...newUser, postal_code: e.target.value })} placeholder="10115" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Funnel / Source</Label>
              <Input value={newUser.funnel} onChange={(e) => setNewUser({ ...newUser, funnel: e.target.value })} placeholder="e.g. Google Ads, Referral, Direct" />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="secondary" onClick={() => {
              const firstNames = ["James","Emma","Liam","Sophia","Noah","Olivia","Lucas","Mia","Alexander","Isabella","Maximilian","Charlotte","Elias","Amelia","Felix","Hannah","Leon","Laura","Matteo","Anna","Oscar","Lea","Erik","Marie","Sebastian","Julia","David","Sarah","Daniel","Elena"];
              const lastNames = ["Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Schäfer","Koch","Bauer","Richter","Klein","Wolf","Schröder","Neumann","Schwarz","Zimmermann","Braun","Krüger","Hofmann","Hartmann","Lange"];
              const countries = ["Germany","Austria","Switzerland","United Kingdom","France","Netherlands","Belgium","Italy","Spain","Sweden","Norway","Denmark","Poland","Ireland","Luxembourg"];
              const citiesByCountry: Record<string, string[]> = {
                Germany: ["Berlin","Munich","Hamburg","Frankfurt","Cologne","Stuttgart","Düsseldorf","Leipzig"],
                Austria: ["Vienna","Salzburg","Graz","Innsbruck","Linz"],
                Switzerland: ["Zurich","Geneva","Basel","Bern","Lausanne"],
                "United Kingdom": ["London","Manchester","Birmingham","Edinburgh","Bristol"],
                France: ["Paris","Lyon","Marseille","Toulouse","Nice"],
                Netherlands: ["Amsterdam","Rotterdam","Utrecht","The Hague"],
                Belgium: ["Brussels","Antwerp","Ghent","Bruges"],
                Italy: ["Rome","Milan","Florence","Naples","Turin"],
                Spain: ["Madrid","Barcelona","Valencia","Seville"],
                Sweden: ["Stockholm","Gothenburg","Malmö"],
                Norway: ["Oslo","Bergen","Trondheim"],
                Denmark: ["Copenhagen","Aarhus","Odense"],
                Poland: ["Warsaw","Krakow","Wroclaw","Gdansk"],
                Ireland: ["Dublin","Cork","Galway"],
                Luxembourg: ["Luxembourg City","Esch-sur-Alzette"],
              };
              const streets = ["Hauptstraße","Bahnhofstraße","Kirchstraße","Gartenstraße","Schulstraße","Ringstraße","Bergstraße","Lindenstraße","Waldstraße","Rosenstraße"];
              const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
              const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
              const country = countries[Math.floor(Math.random() * countries.length)];
              const cities = citiesByCountry[country] || ["Capital"];
              const city = cities[Math.floor(Math.random() * cities.length)];
              const year = 1970 + Math.floor(Math.random() * 30);
              const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
              const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
              const rand4 = Math.floor(1000 + Math.random() * 9000);
              setNewUser({
                first_name: fn,
                last_name: ln,
                email: `${fn.toLowerCase()}.${ln.toLowerCase().replace(/[äöüß]/g, c => ({ä:"ae",ö:"oe",ü:"ue",ß:"ss"}[c] || c))}${rand4}@gmail.com`,
                password: `Pass${rand4}!x`,
                phone: `+49 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000000 + Math.random() * 9000000)}`,
                country,
                city,
                date_of_birth: `${year}-${month}-${day}`,
                address: `${streets[Math.floor(Math.random() * streets.length)]} ${Math.floor(1 + Math.random() * 120)}`,
                postal_code: String(10000 + Math.floor(Math.random() * 90000)),
                funnel: ["Google Ads", "Facebook", "Referral", "Direct", "Instagram", "TikTok", "Affiliate"][Math.floor(Math.random() * 7)],
              });
            }}>
              <Shuffle className="h-4 w-4 mr-1" /> Random
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>User</Label>
              <Select value={depositForm.user_id} onValueChange={(v) => setDepositForm({ ...depositForm, user_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email} {u.full_name ? `(${u.email})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Amount</Label>
                <Input type="number" value={depositForm.amount} onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })} placeholder="1000" />
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Select value={depositForm.currency} onValueChange={(v) => setDepositForm({ ...depositForm, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["EUR", "USD", "GBP", "CHF", "AUD", "CAD"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Method</Label>
              <Select value={depositForm.method} onValueChange={(v) => setDepositForm({ ...depositForm, method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="bank_wire">Bank Wire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea value={depositForm.notes} onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })} placeholder="Reason for manual deposit..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button onClick={submitManualDeposit}>Create & Credit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default AdminUsers;