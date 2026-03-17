import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, MoreHorizontal, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-destructive/10 text-destructive",
  pending: "bg-yellow-500/10 text-yellow-600",
};

const AdminUsers = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [staffUserIds, setStaffUserIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", phone: "", country: "" });
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositForm, setDepositForm] = useState({ user_id: "", amount: "", currency: "EUR", method: "manual", notes: "" });

  const fetchData = async () => {
    const [{ data: profiles }, { data: urData }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id"),
    ]);
    // Staff = anyone with a role assignment
    const staffIds = new Set((urData ?? []).map((ur: any) => ur.user_id));
    setStaffUserIds(staffIds);
    // Only show non-staff profiles (leads/clients)
    setUsers((profiles ?? []).filter(p => !staffIds.has(p.id)));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (userId: string, status: string) => {
    await supabase.from("profiles").update({ status }).eq("id", userId);
    toast.success(`User status updated to ${status}`);
    fetchData();
  };

  const handleCreateUser = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: {
        data: {
          full_name: newUser.full_name,
          phone: newUser.phone,
          country: newUser.country,
        },
      },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("User created successfully");
    setCreateOpen(false);
    setNewUser({ email: "", password: "", full_name: "", phone: "", country: "" });
    setTimeout(fetchData, 1000);
  };

  const submitManualDeposit = async () => {
    if (!depositForm.user_id || !depositForm.amount || Number(depositForm.amount) <= 0) {
      toast.error("Select a user and enter a valid amount");
      return;
    }
    const amount = Number(depositForm.amount);

    await supabase.from("deposits").insert({
      user_id: depositForm.user_id,
      amount,
      currency: depositForm.currency,
      method: depositForm.method,
      status: "approved",
      admin_notes: depositForm.notes || "Manual deposit by admin",
      processed_by: authUser?.id,
    });

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
          <p className="text-muted-foreground text-sm">{users.length} total users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDepositOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Manual Deposit
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Create User
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                   <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                   <th className="text-left p-3 font-medium text-muted-foreground">Country</th>
                   <th className="text-left p-3 font-medium text-muted-foreground">KYC</th>
                   <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                   <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                   <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                 ) : filtered.length === 0 ? (
                   <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No leads found</td></tr>
                ) : (
                  filtered.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/users/${u.id}`)}>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{u.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{u.country || "—"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs capitalize">{u.kyc_status ?? "not_submitted"}</Badge>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[u.status] ?? "bg-muted text-muted-foreground"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateStatus(u.id, "active")}>Set Active</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(u.id, "suspended")}>Suspend</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
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
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Country</Label>
                <Input value={newUser.country} onChange={(e) => setNewUser({ ...newUser, country: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUser}>Create User</Button>
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
    </div>
  );
};

export default AdminUsers;
