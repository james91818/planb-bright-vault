import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Landmark, Search, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const AdminStaking = () => {
  const [stakes, setStakes] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editStake, setEditStake] = useState<any>(null);
  const [rewardsInput, setRewardsInput] = useState("");
  const [claimedInput, setClaimedInput] = useState("false");

  // Plan management
  const [planDialog, setPlanDialog] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({ name: "", asset: "EUR", apy: "", lock_period_days: "", min_amount: "0", enabled: true });

  const fetchData = async () => {
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from("user_stakes").select("*, staking_plans(name, asset, apy), profiles!user_stakes_user_id_fkey(full_name, email)").order("started_at", { ascending: false }),
      supabase.from("staking_plans").select("*").order("created_at", { ascending: false }),
    ]);
    // profiles join may fail due to no FK - fallback
    if (s) {
      // Fetch profiles separately
      const userIds = [...new Set(s.map((x: any) => x.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
      setStakes(s.map((x: any) => ({ ...x, profile: profileMap[x.user_id] })));
    }
    setPlans(p ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const saveStakeOverride = async () => {
    if (!editStake) return;
    const { error } = await supabase.from("user_stakes").update({
      rewards_earned: Number(rewardsInput),
      claimed: claimedInput === "true",
    }).eq("id", editStake.id);
    if (error) { toast.error("Failed to update"); return; }

    // If claiming, credit wallet
    if (claimedInput === "true" && !editStake.claimed) {
      const reward = Number(rewardsInput) || 0;
      const totalReturn = Number(editStake.amount) + reward;
      const { data: wallet } = await supabase.from("wallets").select("id, balance").eq("user_id", editStake.user_id).eq("currency", "EUR").maybeSingle();
      if (wallet) {
        await supabase.from("wallets").update({ balance: Number(wallet.balance) + totalReturn }).eq("id", wallet.id);
      }
    }

    toast.success("Stake updated");
    setEditStake(null);
    fetchData();
  };

  const openPlanDialog = (plan?: any) => {
    if (plan) {
      setEditPlan(plan);
      setPlanForm({ name: plan.name, asset: plan.asset, apy: String(plan.apy), lock_period_days: String(plan.lock_period_days), min_amount: String(plan.min_amount), enabled: plan.enabled });
    } else {
      setEditPlan(null);
      setPlanForm({ name: "", asset: "EUR", apy: "", lock_period_days: "", min_amount: "0", enabled: true });
    }
    setPlanDialog(true);
  };

  const savePlan = async () => {
    const payload = {
      name: planForm.name,
      asset: planForm.asset,
      apy: Number(planForm.apy),
      lock_period_days: Number(planForm.lock_period_days),
      min_amount: Number(planForm.min_amount),
      enabled: planForm.enabled,
    };
    if (editPlan) {
      const { error } = await supabase.from("staking_plans").update(payload).eq("id", editPlan.id);
      if (error) { toast.error("Failed"); return; }
    } else {
      const { error } = await supabase.from("staking_plans").insert(payload);
      if (error) { toast.error("Failed"); return; }
    }
    toast.success(editPlan ? "Plan updated" : "Plan created");
    setPlanDialog(false);
    fetchData();
  };

  const filtered = stakes.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.profile?.full_name?.toLowerCase().includes(q) || s.profile?.email?.toLowerCase().includes(q) || (s as any).staking_plans?.name?.toLowerCase().includes(q);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Staking Management</h1>
          <p className="text-muted-foreground text-sm">Manage plans & control client stake rewards</p>
        </div>
        <Button onClick={() => openPlanDialog()}>+ New Plan</Button>
      </div>

      {/* Plans overview */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
          <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openPlanDialog(p)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-display font-bold text-sm">{p.name}</h3>
                <Badge variant={p.enabled ? "default" : "outline"} className="text-[10px]">{p.enabled ? "Active" : "Disabled"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{p.asset} · {p.apy}% APY · {p.lock_period_days}d lock</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User stakes */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-display font-semibold">All Client Stakes ({stakes.length})</h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search user or plan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Rewards</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Unlocks</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const unlocked = new Date(s.unlocks_at) <= new Date();
                  const reward = Number(s.rewards_earned ?? 0);
                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium">{s.profile?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{s.profile?.email}</p>
                      </td>
                      <td className="p-3">{(s as any).staking_plans?.name}</td>
                      <td className="p-3 font-semibold">€{Number(s.amount).toLocaleString()}</td>
                      <td className="p-3">
                        <span className={reward >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                          {reward >= 0 ? "+" : ""}€{reward.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(s.unlocks_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        {s.claimed ? (
                          <Badge variant="outline">Claimed</Badge>
                        ) : unlocked ? (
                          <Badge className="bg-success/10 text-success border-success/30">Ready</Badge>
                        ) : (
                          <Badge variant="outline">Locked</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" onClick={() => {
                          setEditStake(s);
                          setRewardsInput(String(s.rewards_earned ?? 0));
                          setClaimedInput(s.claimed ? "true" : "false");
                        }}>
                          <DollarSign className="h-3.5 w-3.5 mr-1" /> Manage
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No stakes found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Stake Dialog */}
      <Dialog open={!!editStake} onOpenChange={() => setEditStake(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" /> Manage Stake
            </DialogTitle>
          </DialogHeader>
          {editStake && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">User:</span> {editStake.profile?.full_name} ({editStake.profile?.email})</p>
                <p><span className="text-muted-foreground">Plan:</span> {(editStake as any).staking_plans?.name}</p>
                <p><span className="text-muted-foreground">Staked:</span> €{Number(editStake.amount).toLocaleString()}</p>
                <p><span className="text-muted-foreground">APY:</span> {(editStake as any).staking_plans?.apy}%</p>
                <p><span className="text-muted-foreground">Unlocks:</span> {new Date(editStake.unlocks_at).toLocaleString()}</p>
              </div>

              <div className="space-y-1">
                <Label>Rewards Earned (€)</Label>
                <p className="text-xs text-muted-foreground">Set positive for profit, negative for loss</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-success" onClick={() => setRewardsInput(String(Math.abs(Number(rewardsInput) || 0)))}>
                    <TrendingUp className="h-3.5 w-3.5 mr-1" /> Profit
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRewardsInput(String(-Math.abs(Number(rewardsInput) || 0)))}>
                    <TrendingDown className="h-3.5 w-3.5 mr-1" /> Loss
                  </Button>
                </div>
                <Input type="number" value={rewardsInput} onChange={(e) => setRewardsInput(e.target.value)} placeholder="0.00" />
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={claimedInput} onValueChange={setClaimedInput}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Active (not claimed)</SelectItem>
                    <SelectItem value="true">Claimed (return funds + rewards to wallet)</SelectItem>
                  </SelectContent>
                </Select>
                {claimedInput === "true" && !editStake.claimed && (
                  <p className="text-xs text-success">Will credit €{(Number(editStake.amount) + Number(rewardsInput || 0)).toFixed(2)} to user's EUR wallet</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStake(null)}>Cancel</Button>
            <Button onClick={saveStakeOverride}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan Dialog */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editPlan ? "Edit Plan" : "New Staking Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="e.g. Gold Lock 90" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Asset</Label>
                <Input value={planForm.asset} onChange={(e) => setPlanForm({ ...planForm, asset: e.target.value })} placeholder="EUR" />
              </div>
              <div className="space-y-1">
                <Label>APY (%)</Label>
                <Input type="number" value={planForm.apy} onChange={(e) => setPlanForm({ ...planForm, apy: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Lock Period (days)</Label>
                <Input type="number" value={planForm.lock_period_days} onChange={(e) => setPlanForm({ ...planForm, lock_period_days: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Min Amount (€)</Label>
                <Input type="number" value={planForm.min_amount} onChange={(e) => setPlanForm({ ...planForm, min_amount: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={planForm.enabled} onChange={(e) => setPlanForm({ ...planForm, enabled: e.target.checked })} className="rounded" />
              <Label>Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialog(false)}>Cancel</Button>
            <Button onClick={savePlan}>{editPlan ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStaking;
