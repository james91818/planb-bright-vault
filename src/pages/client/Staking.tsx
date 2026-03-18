import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Landmark, Lock, Clock, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Staking = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [stakes, setStakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stakeOpen, setStakeOpen] = useState<any>(null);
  const [amount, setAmount] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("staking_plans").select("*").eq("enabled", true).order("apy"),
      supabase.from("user_stakes").select("*, staking_plans(name, asset, apy)").eq("user_id", user.id).order("started_at", { ascending: false }),
    ]);
    setPlans(p ?? []);
    setStakes(s ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const stake = async () => {
    if (!user || !stakeOpen || !amount) return;
    const amtNum = Number(amount);
    if (amtNum < Number(stakeOpen.min_amount)) {
      toast.error(`Minimum amount is €${stakeOpen.min_amount}`);
      return;
    }
    // Debit wallet
    const { data: wallet } = await supabase.from("wallets").select("id, balance").eq("user_id", user.id).eq("currency", "EUR").maybeSingle();
    if (!wallet || Number(wallet.balance) < amtNum) {
      toast.error("Insufficient balance");
      return;
    }
    await supabase.from("wallets").update({ balance: Number(wallet.balance) - amtNum }).eq("id", wallet.id);

    const unlocks = new Date();
    unlocks.setDate(unlocks.getDate() + stakeOpen.lock_period_days);

    await supabase.from("user_stakes").insert({
      user_id: user.id,
      plan_id: stakeOpen.id,
      amount: amtNum,
      unlocks_at: unlocks.toISOString(),
    });

    toast.success("Staking activated!");
    setStakeOpen(null);
    setAmount("");
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Staking</h1>
        <p className="text-muted-foreground text-sm">Earn passive income by locking your assets</p>
      </div>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-bold">{p.name}</h3>
                </div>
                <Badge className="bg-success/10 text-success border-success/30">{p.apy}% APY</Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Lock: {p.lock_period_days} days</div>
                <div className="flex items-center gap-2"><Landmark className="h-3.5 w-3.5" /> Asset: {p.asset}</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> Min: €{Number(p.min_amount).toLocaleString()}</div>
              </div>
              <Button className="w-full" onClick={() => { setStakeOpen(p); setAmount(""); }}>Stake Now</Button>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">No staking plans available</p>}
      </div>

      {/* Active Stakes */}
      {stakes.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b"><h3 className="font-display font-semibold">Your Stakes</h3></div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[550px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Plan</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">APY</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Rewards</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Unlocks</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {stakes.map((s) => {
                  const unlocked = new Date(s.unlocks_at) <= new Date();
                  const reward = Number(s.rewards_earned ?? 0);
                  return (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-3 font-medium">{(s as any).staking_plans?.name}</td>
                      <td className="p-3">€{Number(s.amount).toLocaleString()}</td>
                      <td className="p-3 text-success font-semibold">{(s as any).staking_plans?.apy}%</td>
                      <td className={`p-3 font-semibold ${reward >= 0 ? "text-success" : "text-destructive"}`}>
                        {reward >= 0 ? "+" : ""}€{reward.toFixed(2)}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(s.unlocks_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        {s.claimed ? (
                          <Badge variant="outline">Claimed</Badge>
                        ) : unlocked ? (
                          <Badge className="bg-success/10 text-success border-success/30">Ready to claim</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Locked</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stake Dialog */}
      <Dialog open={!!stakeOpen} onOpenChange={() => setStakeOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Stake in {stakeOpen?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">APY:</span> <span className="font-bold text-success">{stakeOpen?.apy}%</span></p>
              <p><span className="text-muted-foreground">Lock Period:</span> {stakeOpen?.lock_period_days} days</p>
              <p><span className="text-muted-foreground">Minimum:</span> €{Number(stakeOpen?.min_amount ?? 0).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <Label>Amount (€)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min €${stakeOpen?.min_amount}`} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStakeOpen(null)}>Cancel</Button>
            <Button onClick={stake}>Confirm Stake</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staking;
