import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Shield, LogOut, Tag, Plus, Pencil, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { invalidateStatusCache } from "@/components/admin/StatusChanger";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const Settings = () => {
  const { user, signOut } = useAuth();
  const { isStaff } = useRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: "", phone: "", country: "" });
  const [passwordForm, setPasswordForm] = useState({ password: "", confirm: "" });

  // Status management
  const [statuses, setStatuses] = useState<any[]>([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [statusForm, setStatusForm] = useState({ name: "", color: "bg-muted text-muted-foreground" });

  const colorOptions = [
    { label: "Green", value: "bg-success/10 text-success" },
    { label: "Red", value: "bg-destructive/10 text-destructive" },
    { label: "Yellow", value: "bg-yellow-500/10 text-yellow-600" },
    { label: "Blue", value: "bg-blue-500/10 text-blue-600" },
    { label: "Purple", value: "bg-purple-500/10 text-purple-600" },
    { label: "Orange", value: "bg-orange-500/10 text-orange-600" },
    { label: "Primary", value: "bg-primary/10 text-primary" },
    { label: "Gray", value: "bg-muted text-muted-foreground" },
  ];

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      setProfile(data);
      if (data) setForm({ full_name: data.full_name ?? "", phone: data.phone ?? "", country: data.country ?? "" });
      setLoading(false);
    });
  }, [user]);

  const fetchStatuses = async () => {
    const { data } = await supabase.from("lead_statuses").select("*").order("sort_order");
    setStatuses(data ?? []);
  };

  useEffect(() => {
    if (isStaff) fetchStatuses();
  }, [isStaff]);

  const updateProfile = async () => {
    if (!user) return;
    await supabase.from("profiles").update(form).eq("id", user.id);
    toast.success("Profile updated");
  };

  const updatePassword = async () => {
    if (passwordForm.password !== passwordForm.confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (passwordForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated");
      setPasswordForm({ password: "", confirm: "" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const openStatusDialog = (status?: any) => {
    if (status) {
      setEditingStatus(status);
      setStatusForm({ name: status.name, color: status.color });
    } else {
      setEditingStatus(null);
      setStatusForm({ name: "", color: "bg-muted text-muted-foreground" });
    }
    setStatusDialogOpen(true);
  };

  const saveStatus = async () => {
    if (!statusForm.name.trim()) {
      toast.error("Status name is required");
      return;
    }
    if (editingStatus) {
      await supabase.from("lead_statuses").update({ name: statusForm.name, color: statusForm.color }).eq("id", editingStatus.id);
      toast.success("Status updated");
    } else {
      const maxOrder = statuses.length > 0 ? Math.max(...statuses.map(s => s.sort_order)) : 0;
      await supabase.from("lead_statuses").insert({ name: statusForm.name, color: statusForm.color, sort_order: maxOrder + 1 });
      toast.success("Status created");
    }
    invalidateStatusCache();
    setStatusDialogOpen(false);
    fetchStatuses();
  };

  const deleteStatus = async (id: string) => {
    await supabase.from("lead_statuses").delete().eq("id", id);
    toast.success("Status deleted");
    invalidateStatusCache();
    fetchStatuses();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
          </div>
          <Button onClick={updateProfile}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>New Password</Label>
            <Input type="password" value={passwordForm.password} onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Confirm Password</Label>
            <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
          </div>
          <Button onClick={updatePassword} variant="outline">Update Password</Button>
        </CardContent>
      </Card>

      {/* Lead Statuses — Staff only */}
      {isStaff && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Tag className="h-4 w-4" /> Lead / Depositor Statuses
            </CardTitle>
            <Button size="sm" onClick={() => openStatusDialog()}>
              <Plus className="h-4 w-4 mr-1" /> Add Status
            </Button>
          </CardHeader>
          <CardContent>
            {statuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No statuses configured.</p>
            ) : (
              <div className="space-y-2">
                {statuses.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2 px-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStatusDialog(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteStatus(s.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sign Out */}
      <Card>
        <CardContent className="p-4">
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Status Create/Edit Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatus ? "Edit Status" : "Create Status"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={statusForm.name} onChange={(e) => setStatusForm({ ...statusForm, name: e.target.value })} placeholder="e.g. Interested" />
            </div>
            <div className="space-y-1">
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    className={`text-xs px-3 py-2 rounded-lg font-medium border-2 transition-all ${c.value} ${statusForm.color === c.value ? "border-primary ring-1 ring-primary" : "border-transparent"}`}
                    onClick={() => setStatusForm({ ...statusForm, color: c.value })}
                    type="button"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveStatus}>{editingStatus ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
