import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, TrendingUp, Eye, EyeOff } from "lucide-react";

interface CopyTrader {
  id: string;
  user_id: string | null;
  display_name: string;
  avatar_url: string | null;
  description: string | null;
  win_rate: number;
  total_pnl: number;
  total_trades: number;
  followers_count: number;
  is_visible: boolean;
  is_admin_managed: boolean;
}

const AdminCopyTrading = () => {
  const [traders, setTraders] = useState<CopyTrader[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CopyTrader | null>(null);
  const [form, setForm] = useState({
    display_name: "",
    description: "",
    win_rate: "0",
    total_pnl: "0",
    total_trades: "0",
    is_visible: true,
    is_admin_managed: true,
  });
  const [subsCount, setSubsCount] = useState<Record<string, number>>({});

  const fetchData = async () => {
    const { data: t } = await supabase.from("copy_traders").select("*").order("created_at", { ascending: false });
    setTraders((t ?? []) as CopyTrader[]);

    // Fetch subscription counts
    const { data: subs } = await supabase.from("copy_subscriptions").select("trader_id");
    const counts: Record<string, number> = {};
    (subs ?? []).forEach((s: any) => {
      counts[s.trader_id] = (counts[s.trader_id] ?? 0) + 1;
    });
    setSubsCount(counts);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ display_name: "", description: "", win_rate: "0", total_pnl: "0", total_trades: "0", is_visible: true, is_admin_managed: true });
    setDialogOpen(true);
  };

  const openEdit = (trader: CopyTrader) => {
    setEditing(trader);
    setForm({
      display_name: trader.display_name,
      description: trader.description ?? "",
      win_rate: String(trader.win_rate),
      total_pnl: String(trader.total_pnl),
      total_trades: String(trader.total_trades),
      is_visible: trader.is_visible,
      is_admin_managed: trader.is_admin_managed,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.display_name.trim()) { toast.error("Name is required"); return; }
    const payload = {
      display_name: form.display_name,
      description: form.description || null,
      win_rate: Number(form.win_rate) || 0,
      total_pnl: Number(form.total_pnl) || 0,
      total_trades: Number(form.total_trades) || 0,
      is_visible: form.is_visible,
      is_admin_managed: form.is_admin_managed,
    };
    if (editing) {
      await supabase.from("copy_traders").update(payload).eq("id", editing.id);
      toast.success("Trader updated");
    } else {
      await supabase.from("copy_traders").insert(payload);
      toast.success("Trader created");
    }
    setDialogOpen(false);
    fetchData();
  };

  const deleteTrader = async (id: string) => {
    await supabase.from("copy_traders").delete().eq("id", id);
    toast.success("Trader deleted");
    fetchData();
  };

  const toggleVisibility = async (trader: CopyTrader) => {
    await supabase.from("copy_traders").update({ is_visible: !trader.is_visible }).eq("id", trader.id);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Copy Trading</h1>
          <p className="text-muted-foreground text-sm">Manage signal providers and master traders</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Trader
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Win Rate</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">P&L</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Trades</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Followers</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Visible</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : traders.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No traders yet. Create your first signal provider.</td></tr>
                ) : (
                  traders.map(t => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {t.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{t.display_name}</p>
                            {t.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {t.is_admin_managed ? "Signal Provider" : "Real Trader"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <span className={`font-semibold ${t.win_rate >= 50 ? "text-success" : "text-destructive"}`}>
                          {t.win_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className={`p-3 font-semibold ${t.total_pnl >= 0 ? "text-success" : "text-destructive"}`}>
                        {t.total_pnl >= 0 ? "+" : ""}€{Number(t.total_pnl).toLocaleString()}
                      </td>
                      <td className="p-3">{t.total_trades}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">{subsCount[t.id] ?? 0}</Badge>
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVisibility(t)}>
                          {t.is_visible ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => openEdit(t)}>
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => deleteTrader(t.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Trader" : "Create Signal Provider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Display Name *</Label>
              <Input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="e.g. CryptoKing" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Specializes in BTC and ETH swing trades..." rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Win Rate (%)</Label>
                <Input type="number" value={form.win_rate} onChange={e => setForm({ ...form, win_rate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Total P&L (€)</Label>
                <Input type="number" value={form.total_pnl} onChange={e => setForm({ ...form, total_pnl: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Total Trades</Label>
                <Input type="number" value={form.total_trades} onChange={e => setForm({ ...form, total_trades: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Admin-Managed Signal</Label>
                <p className="text-xs text-muted-foreground">Admin controls the stats and signals</p>
              </div>
              <Switch checked={form.is_admin_managed} onCheckedChange={v => setForm({ ...form, is_admin_managed: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Visible to Clients</Label>
                <p className="text-xs text-muted-foreground">Show on the leaderboard</p>
              </div>
              <Switch checked={form.is_visible} onCheckedChange={v => setForm({ ...form, is_visible: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCopyTrading;
