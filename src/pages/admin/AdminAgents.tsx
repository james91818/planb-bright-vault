import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, MoreHorizontal, KeyRound } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  suspended: "bg-destructive/10 text-destructive",
  pending: "bg-yellow-500/10 text-yellow-600",
};

const AdminAgents = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ email: "", password: "", full_name: "", role_id: "" });

  // Password reset
  const [pwOpen, setPwOpen] = useState(false);
  const [pwUserId, setPwUserId] = useState("");
  const [pwUserName, setPwUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const fetchData = async () => {
    const [{ data: rolesData }, { data: urData }] = await Promise.all([
      supabase.from("roles").select("*"),
      supabase.from("user_roles").select("user_id, role_id, roles(name)"),
    ]);

    setRoles(rolesData ?? []);

    const agentUserIds = (urData ?? []).map((ur: any) => ur.user_id);
    const roleMap: Record<string, { name: string; role_id: string }> = {};
    (urData ?? []).forEach((ur: any) => {
      roleMap[ur.user_id] = { name: ur.roles?.name ?? "", role_id: ur.role_id };
    });

    if (agentUserIds.length === 0) {
      setAgents([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .in("id", agentUserIds)
      .order("created_at", { ascending: false });

    const enriched = (profiles ?? []).map(p => ({
      ...p,
      role_name: roleMap[p.id]?.name ?? "",
      role_id: roleMap[p.id]?.role_id ?? "",
    }));

    setAgents(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (userId: string, status: string) => {
    await supabase.from("profiles").update({ status }).eq("id", userId);
    toast.success(`Agent status updated to ${status}`);
    fetchData();
  };

  const assignRole = async (userId: string, roleId: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    if (roleId !== "none") {
      await supabase.from("user_roles").insert({ user_id: userId, role_id: roleId });
    }
    toast.success("Role updated");
    fetchData();
  };

  const handleResetPassword = async () => {
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
      toast.success("Password reset successfully");
      setPwOpen(false);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setPwLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!newAgent.role_id) {
      toast.error("Please select a role for the agent");
      return;
    }
    if (!newAgent.email || !newAgent.password) {
      toast.error("Email and password are required");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-actions", {
        body: {
          action: "create_user",
          email: newAgent.email,
          password: newAgent.password,
          full_name: newAgent.full_name,
          role_id: newAgent.role_id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Agent created successfully — they can log in now");
      setCreateOpen(false);
      setNewAgent({ email: "", password: "", full_name: "", role_id: "" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create agent");
    }
  };

  const filtered = agents.filter(u =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Agents</h1>
          <p className="text-muted-foreground text-sm">{agents.length} staff members</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" /> Create Agent
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Agent</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Joined</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No agents found</td></tr>
                ) : (
                  filtered.map(u => (
                    <tr
                      key={u.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/users/${u.id}`)}
                    >
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-primary hover:underline">{u.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <Select
                          value={u.role_id || "none"}
                          onValueChange={(val) => assignRole(u.id, val)}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs" onClick={e => e.stopPropagation()}>
                            <SelectValue placeholder="No role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No role</SelectItem>
                            {roles.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[u.status] ?? "bg-muted text-muted-foreground"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/users/${u.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateStatus(u.id, "active")}>Set Active</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(u.id, "suspended")}>Suspend</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setPwUserId(u.id);
                              setPwUserName(u.full_name || u.email);
                              setPwOpen(true);
                            }}>
                              <KeyRound className="h-4 w-4 mr-2" /> Reset Password
                            </DropdownMenuItem>
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

      {/* Create Agent Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input value={newAgent.full_name} onChange={e => setNewAgent({ ...newAgent, full_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={newAgent.email} onChange={e => setNewAgent({ ...newAgent, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input type="password" value={newAgent.password} onChange={e => setNewAgent({ ...newAgent, password: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={newAgent.role_id} onValueChange={val => setNewAgent({ ...newAgent, role_id: val })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAgent}>Create Agent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password — {pwUserName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwOpen(false); setNewPassword(""); }}>Cancel</Button>
            <Button onClick={handleResetPassword} disabled={pwLoading}>
              {pwLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAgents;
