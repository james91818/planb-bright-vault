import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RolePermissionDialog from "@/components/admin/RolePermissionDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
}

interface Permission {
  id: string;
  key: string;
  label: string;
  category: string;
}

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    const [rolesRes, permsRes, rpRes] = await Promise.all([
      supabase.from("roles").select("*").order("created_at"),
      supabase.from("permissions").select("*").order("category, label"),
      supabase.from("role_permissions").select("role_id, permission_id"),
    ]);

    if (rolesRes.data) setRoles(rolesRes.data);
    if (permsRes.data) setPermissions(permsRes.data);
    if (rpRes.data) {
      const map: Record<string, string[]> = {};
      rpRes.data.forEach((rp) => {
        if (!map[rp.role_id]) map[rp.role_id] = [];
        map[rp.role_id].push(rp.permission_id);
      });
      setRolePermissions(map);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (role: Role) => {
    const { error } = await supabase.from("roles").delete().eq("id", role.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role deleted" });
      fetchData();
    }
  };

  const handleSave = async (name: string, description: string, selectedPermissionIds: string[], roleId?: string) => {
    if (roleId) {
      // Update role
      const { error } = await supabase.from("roles").update({ name, description }).eq("id", roleId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

      // Replace permissions: delete all, then insert new
      await supabase.from("role_permissions").delete().eq("role_id", roleId);
      if (selectedPermissionIds.length > 0) {
        await supabase.from("role_permissions").insert(
          selectedPermissionIds.map((pid) => ({ role_id: roleId, permission_id: pid }))
        );
      }
    } else {
      // Create role
      const { data, error } = await supabase.from("roles").insert({ name, description }).select().single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

      if (data && selectedPermissionIds.length > 0) {
        await supabase.from("role_permissions").insert(
          selectedPermissionIds.map((pid) => ({ role_id: data.id, permission_id: pid }))
        );
      }
    }

    toast({ title: roleId ? "Role updated" : "Role created" });
    setDialogOpen(false);
    fetchData();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <Button onClick={() => { setIsNew(true); setEditingRole(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Role
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      {role.name}
                      {role.is_system && <Badge variant="secondary" className="ml-2">System</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{role.description}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {rolePermissions[role.id]?.length || 0} permissions
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setIsNew(false); setEditingRole(role); setDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!role.is_system && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete role "{role.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>This will remove the role and unlink it from all users.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(role)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <RolePermissionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={isNew ? null : editingRole}
        permissions={permissions}
        selectedPermissionIds={editingRole && !isNew ? rolePermissions[editingRole.id] || [] : []}
        onSave={handleSave}
      />
    </AppLayout>
  );
};

export default RolesPage;
