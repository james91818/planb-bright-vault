import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const FIELD_OPTIONS = [
  { key: "name", label: "Lead Name", description: "Full name of the lead" },
  { key: "email", label: "Email", description: "Lead's email address" },
  { key: "phone", label: "Phone", description: "Lead's phone number" },
  { key: "country", label: "Country", description: "Lead's country" },
  { key: "funnel", label: "Funnel", description: "Source funnel / campaign" },
  { key: "status", label: "Status", description: "Current lead status" },
  { key: "registered_at", label: "Registration Date", description: "When the lead registered" },
  { key: "deposit_date", label: "First Deposit Date", description: "first_deposit_at — when the lead made their first deposit" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate: {
    id: string;
    name: string;
    visible_fields?: Record<string, boolean>;
  } | null;
  onSaved: () => void;
}

const getDefaults = (): Record<string, boolean> =>
  Object.fromEntries(FIELD_OPTIONS.map(f => [f.key, true]));

const AffiliateFieldSettings = ({ open, onOpenChange, affiliate, onSaved }: Props) => {
  const currentFields = affiliate?.visible_fields ?? getDefaults();
  const [fields, setFields] = useState<Record<string, boolean>>(currentFields);
  const [saving, setSaving] = useState(false);

  // Reset state when affiliate changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && affiliate) {
      setFields(affiliate.visible_fields ?? getDefaults());
    }
    onOpenChange(isOpen);
  };

  const toggle = (key: string) => {
    setFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!affiliate || saving) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("affiliates")
        .update({ visible_fields: fields as any })
        .eq("id", affiliate.id);
      if (error) throw error;
      toast.success("Field visibility updated");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = Object.values(fields).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>API Field Settings — {affiliate?.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Control which data fields this affiliate receives in their API response. Disabled fields will return as <code className="text-xs bg-muted px-1 rounded">null</code>.
        </p>
        <div className="space-y-3 mt-2">
          {FIELD_OPTIONS.map(opt => (
            <div key={opt.key} className="flex items-center justify-between py-2 px-3 rounded-lg border">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium cursor-pointer">{opt.label}</Label>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              <Switch
                checked={fields[opt.key] !== false}
                onCheckedChange={() => toggle(opt.key)}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {enabledCount} of {FIELD_OPTIONS.length} fields enabled. The <code className="bg-muted px-1 rounded">id</code> field is always included.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AffiliateFieldSettings;
