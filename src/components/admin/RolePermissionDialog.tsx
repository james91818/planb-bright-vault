import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface Permission {
  id: string;
  key: string;
  label: string;
  category: string;
}

interface RolePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: { id: string; name: string; description: string | null } | null;
  permissions: Permission[];
  selectedPermissionIds: string[];
  onSave: (name: string, description: string, permissionIds: string[], roleId?: string) => void;
}

const RolePermissionDialog: React.FC<RolePermissionDialogProps> = ({
  open, onOpenChange, role, permissions, selectedPermissionIds, onSave,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setName(role?.name || "");
      setDescription(role?.description || "");
      setSelected(new Set(selectedPermissionIds));
    }
  }, [open, role, selectedPermissionIds]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Group permissions by category
  const grouped = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? `Edit Role: ${role.name}` : "Create New Role"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Role Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Supervisor" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What can this role do?" />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground">Permissions</label>
            {Object.entries(grouped).map(([category, perms]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {perms.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-accent/50 transition-colors">
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={() => toggle(p.id)}
                      />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(name, description, [...selected], role?.id)} disabled={!name.trim()}>
            {role ? "Save Changes" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RolePermissionDialog;
