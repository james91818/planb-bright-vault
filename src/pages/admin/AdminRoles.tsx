import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AdminRoles = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  const fetchData = async () => {
    const [{ data: r }, { data: p }, { data: rp }] = await Promise.all([
      supabase.from("roles").select("*").order("name"),
      supabase.from("permissions").select("*").order("category").order("key"),
      supabase.from("role_permissions").select("role_id, permission_id"),
    ]);
    setRoles(r ?? []);
    setPermissions(p ?? []);
    const map: Record<string, string[]> = {};
    (rp ?? []).forEach((item: any) => {
      if (!map[item.role_id]) map[item.role_id] = [];
      map[item.role_id].push(item.permission_id);
    });
    setRolePerms(map);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const togglePerm = async (roleId: string, permId: string) => {
    const has = (rolePerms[roleId] ?? []).includes(permId);
    if (has) {
      await supabase.from("role_permissions").delete().eq("role_id", roleId).eq("permission_id", permId);
    } else {
      await supabase.from("role_permissions").insert({ role_id: roleId, permission_id: permId });
    }
    toast.success("Permission updated");
    fetchData();
  };

  const createRole = async () => {
    await supabase.from("roles").insert(newRole);
    toast.success("Role created");
    setCreateOpen(false);
    setNewRole({ name: "", description: "" });
    fetchData();
  };

  const deleteRole = async (id: string) => {
    await supabase.from("role_permissions").delete().eq("role_id", id);
    await supabase.from("user_roles").delete().eq("role_id", id);
    await supabase.from("roles").delete().eq("id", id);
    toast.success("Role deleted");
    fetchData();
  };

  const permsByCategory = permissions.reduce<Record<string, any[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground text-sm">Manage staff roles and access control</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Role</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border rounded-lg">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium text-muted-foreground min-w-[200px]">Permission</th>
              {roles.map((r) => (
                <th key={r.id} className="text-center p-3 font-medium min-w-[100px]">
                  <div>{r.name}</div>
                  {!r.is_system && (
                    <Button variant="ghost" size="icon" className="h-5 w-5 mt-1" onClick={() => deleteRole(r.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(permsByCategory).map(([cat, perms]) => (
              <>
                <tr key={cat}>
                  <td colSpan={roles.length + 1} className="p-2 bg-muted/30 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </td>
                </tr>
                {perms.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <p className="font-medium text-xs">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground">{p.key}</p>
                    </td>
                    {roles.map((r) => (
                      <td key={r.id} className="text-center p-3">
                        <Checkbox
                          checked={(rolePerms[r.id] ?? []).includes(p.id)}
                          onCheckedChange={() => togglePerm(r.id, p.id)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Role</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} placeholder="e.g. Senior Agent" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createRole}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRoles;
