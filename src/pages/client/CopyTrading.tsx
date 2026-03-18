import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Copy, TrendingUp, TrendingDown, Users, Award, Target, Zap,
  UserPlus, Settings2, Pause, Play, X,
} from "lucide-react";

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
  is_admin_managed: boolean;
}

interface Subscription {
  id: string;
  user_id: string;
  trader_id: string;
  mode: string;
  fixed_amount: number;
  is_active: boolean;
  created_at: string;
  copy_traders?: CopyTrader;
}

const CopyTrading = () => {
  const { user } = useAuth();
  const [traders, setTraders] = useState<CopyTrader[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribeOpen, setSubscribeOpen] = useState<CopyTrader | null>(null);
  const [subMode, setSubMode] = useState("auto");
  const [fixedAmount, setFixedAmount] = useState("100");
  const [editSub, setEditSub] = useState<Subscription | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from("copy_traders").select("*").eq("is_visible", true).order("total_pnl", { ascending: false }),
      supabase.from("copy_subscriptions").select("*, copy_traders(*)").eq("user_id", user.id),
    ]);
    setTraders((t ?? []) as CopyTrader[]);
    setSubscriptions((s ?? []) as Subscription[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const subscribedTraderIds = new Set(subscriptions.map(s => s.trader_id));

  const handleSubscribe = async () => {
    if (!user || !subscribeOpen) return;
    const { error } = await supabase.from("copy_subscriptions").insert({
      user_id: user.id,
      trader_id: subscribeOpen.id,
      mode: subMode,
      fixed_amount: Number(fixedAmount) || 100,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(`Now copying ${subscribeOpen.display_name}`);
    setSubscribeOpen(null);
    fetchData();
  };

  const toggleSubscription = async (sub: Subscription) => {
    await supabase.from("copy_subscriptions").update({ is_active: !sub.is_active }).eq("id", sub.id);
    toast.success(sub.is_active ? "Copy trading paused" : "Copy trading resumed");
    fetchData();
  };

  const unsubscribe = async (sub: Subscription) => {
    await supabase.from("copy_subscriptions").delete().eq("id", sub.id);
    toast.success("Unsubscribed");
    fetchData();
  };

  const updateSubscription = async () => {
    if (!editSub) return;
    await supabase.from("copy_subscriptions").update({
      mode: subMode,
      fixed_amount: Number(fixedAmount) || 100,
    }).eq("id", editSub.id);
    toast.success("Settings updated");
    setEditSub(null);
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const activeSubscriptions = subscriptions.filter(s => s.is_active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Copy Trading</h1>
        <p className="text-muted-foreground text-sm">Follow top traders and automatically copy their trades</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Copy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Copies</p>
              <p className="text-xl font-display font-bold">{activeSubscriptions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available Traders</p>
              <p className="text-xl font-display font-bold">{traders.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Subscriptions</p>
              <p className="text-xl font-display font-bold">{subscriptions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="my-copies">My Copies ({subscriptions.length})</TabsTrigger>
        </TabsList>

        {/* LEADERBOARD */}
        <TabsContent value="leaderboard" className="mt-4">
          {traders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No traders available yet</p>
                <p className="text-sm mt-1">Check back soon for signal providers</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {traders.map((trader, idx) => {
                const isSubscribed = subscribedTraderIds.has(trader.id);
                return (
                  <Card key={trader.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                    {idx < 3 && (
                      <div className="absolute top-3 right-3">
                        <Badge className={`text-[10px] ${idx === 0 ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" : idx === 1 ? "bg-gray-400/10 text-gray-500 border-gray-400/30" : "bg-orange-500/10 text-orange-600 border-orange-500/30"}`}>
                          <Award className="h-3 w-3 mr-0.5" /> #{idx + 1}
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                          {trader.avatar_url ? (
                            <img src={trader.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                            trader.display_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{trader.display_name}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5">
                            {trader.is_admin_managed && (
                              <Badge variant="outline" className="text-[10px]">
                                <Zap className="h-2.5 w-2.5 mr-0.5" /> Pro Signal
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{trader.followers_count} followers</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {trader.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{trader.description}</p>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground uppercase">Win Rate</p>
                          <p className={`text-sm font-bold ${trader.win_rate >= 50 ? "text-success" : "text-destructive"}`}>
                            {trader.win_rate.toFixed(1)}%
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground uppercase">P&L</p>
                          <p className={`text-sm font-bold ${trader.total_pnl >= 0 ? "text-success" : "text-destructive"}`}>
                            {trader.total_pnl >= 0 ? "+" : ""}€{trader.total_pnl.toFixed(0)}
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-[10px] text-muted-foreground uppercase">Trades</p>
                          <p className="text-sm font-bold">{trader.total_trades}</p>
                        </div>
                      </div>
                      {isSubscribed ? (
                        <Button variant="outline" className="w-full" disabled>
                          <Copy className="h-4 w-4 mr-2" /> Already Copying
                        </Button>
                      ) : (
                        <Button className="w-full" onClick={() => {
                          setSubscribeOpen(trader);
                          setSubMode("auto");
                          setFixedAmount("100");
                        }}>
                          <UserPlus className="h-4 w-4 mr-2" /> Copy Trader
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* MY COPIES */}
        <TabsContent value="my-copies" className="mt-4">
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Copy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No active copy subscriptions</p>
                <p className="text-sm mt-1">Browse the leaderboard and start copying top traders</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {subscriptions.map(sub => {
                const trader = sub.copy_traders;
                if (!trader) return null;
                return (
                  <Card key={sub.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {trader.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{trader.display_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={sub.is_active ? "default" : "secondary"} className="text-[10px]">
                              {sub.is_active ? "Active" : "Paused"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {sub.mode === "auto" ? "Auto-copy" : "Manual confirm"} · €{Number(sub.fixed_amount).toLocaleString()} per trade
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2 hidden sm:block">
                          <p className={`text-sm font-bold ${trader.total_pnl >= 0 ? "text-success" : "text-destructive"}`}>
                            {trader.total_pnl >= 0 ? "+" : ""}€{trader.total_pnl.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{trader.win_rate.toFixed(1)}% win rate</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setEditSub(sub);
                          setSubMode(sub.mode);
                          setFixedAmount(String(sub.fixed_amount));
                        }}>
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSubscription(sub)}>
                          {sub.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => unsubscribe(sub)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Subscribe Dialog */}
      <Dialog open={!!subscribeOpen} onOpenChange={() => setSubscribeOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy {subscribeOpen?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure how you want to copy this trader's positions.
            </p>
            <div className="space-y-2">
              <Label>Copy Mode</Label>
              <Select value={subMode} onValueChange={setSubMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-copy (trades execute automatically)</SelectItem>
                  <SelectItem value="manual">Manual confirm (approve each trade)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fixed Amount per Trade (€)</Label>
              <Input type="number" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} placeholder="100" />
              <p className="text-xs text-muted-foreground">Each copied trade will use this amount regardless of the trader's position size</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubscribeOpen(null)}>Cancel</Button>
            <Button onClick={handleSubscribe}>Start Copying</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Dialog */}
      <Dialog open={!!editSub} onOpenChange={() => setEditSub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Copy Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Copy Mode</Label>
              <Select value={subMode} onValueChange={setSubMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-copy</SelectItem>
                  <SelectItem value="manual">Manual confirm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fixed Amount per Trade (€)</Label>
              <Input type="number" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSub(null)}>Cancel</Button>
            <Button onClick={updateSubscription}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CopyTrading;
