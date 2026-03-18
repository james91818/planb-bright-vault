import { useEffect, useState, useCallback } from "react";
import { fetchLivePrices, computeLivePnl } from "@/lib/tradePnl";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const AdminTrades = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideOpen, setOverrideOpen] = useState<any>(null);
  const [overrideMode, setOverrideMode] = useState("none");
  const [targetValue, setTargetValue] = useState("");
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  const fetchTrades = async () => {
    const { data: tradesData } = await supabase
      .from("trades")
      .select("*, assets(symbol, name), trade_overrides(*)")
      .order("opened_at", { ascending: false })
      .limit(100);

    if (tradesData && tradesData.length > 0) {
      // Fetch profiles for all unique user_ids
      const userIds = [...new Set(tradesData.map((t) => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
      const enriched = tradesData.map((t) => ({
        ...t,
        profiles: profileMap[t.user_id] || null,
      }));
      setTrades(enriched);
    } else {
      setTrades(tradesData ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTrades(); }, []);

  // Fetch live prices for P&L
  const refreshPrices = useCallback(async () => {
    const symbols = [...new Set(trades.map((t: any) => t.assets?.symbol).filter(Boolean))] as string[];
    if (symbols.length) {
      const prices = await fetchLivePrices(symbols);
      if (Object.keys(prices).length) setLivePrices(prices);
    }
  }, [trades]);

  useEffect(() => { refreshPrices(); }, [refreshPrices]);
  useEffect(() => {
    if (!trades.length) return;
    const interval = setInterval(refreshPrices, 30000);
    return () => clearInterval(interval);
  }, [trades, refreshPrices]);

  const closeTrade = async (trade: any, pnl: number) => {
    await supabase.from("trades").update({
      status: "closed",
      closed_at: new Date().toISOString(),
      pnl,
    }).eq("id", trade.id);

    // Credit/debit wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", trade.user_id)
      .eq("currency", "EUR")
      .maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({
        balance: Number(wallet.balance) + Number(trade.size) + pnl,
      }).eq("id", wallet.id);
    }

    toast.success("Trade closed");
    fetchTrades();
  };

  const setOverride = async () => {
    if (!overrideOpen) return;
    // Check existing override
    const existing = overrideOpen.trade_overrides;
    if (existing && existing.length > 0) {
      await supabase.from("trade_overrides").update({
        override_mode: overrideMode,
        target_value: targetValue ? Number(targetValue) : null,
        applied_by: user?.id,
        is_active: overrideMode !== "none",
      }).eq("id", existing[0].id);
    } else {
      await supabase.from("trade_overrides").insert({
        trade_id: overrideOpen.id,
        override_mode: overrideMode,
        target_value: targetValue ? Number(targetValue) : null,
        applied_by: user?.id,
        is_active: overrideMode !== "none",
      });
    }
    toast.success("Trade override set");
    setOverrideOpen(null);
    fetchTrades();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Trades</h1>
        <p className="text-muted-foreground text-sm">View and manage all client trades</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Asset</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Direction</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Size</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Entry</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Leverage</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">P&L</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Override</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : trades.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No trades yet</td></tr>
                ) : (
                  trades.map((t) => {
                    const override = t.trade_overrides?.[0];
                    const symbol = (t as any).assets?.symbol;
                    const pnl = computeLivePnl(t, livePrices[symbol]);
                    return (
                      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <p className="font-medium text-xs">{(t as any).profiles?.full_name || "—"}</p>
                        </td>
                        <td className="p-3 font-medium">{symbol ?? "—"}</td>
                        <td className="p-3">
                          <Badge variant={t.direction === "buy" ? "default" : "destructive"} className="text-xs capitalize">
                            {t.direction}
                          </Badge>
                        </td>
                        <td className="p-3">€{Number(t.size).toLocaleString()}</td>
                        <td className="p-3">€{Number(t.entry_price).toFixed(2)}</td>
                        <td className="p-3">{t.leverage}×</td>
                        <td className={`p-3 font-semibold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                          {pnl >= 0 ? "+" : ""}€{pnl.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="capitalize text-xs">{t.status}</Badge>
                        </td>
                        <td className="p-3">
                          {override?.is_active ? (
                            <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                              {override.override_mode}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {t.status === "open" && (
                            <>
                              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
                                setOverrideOpen(t);
                                setOverrideMode(override?.override_mode ?? "none");
                                setTargetValue(override?.target_value?.toString() ?? "");
                              }}>
                                Override
                              </Button>
                              <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => closeTrade(t, pnl)}>
                                Close
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      <Dialog open={!!overrideOpen} onOpenChange={() => setOverrideOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Set Trade Override</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Control the outcome of this trade. The client will not see this override.
            </p>
            <div className="space-y-1">
              <Label>Override Mode</Label>
              <Select value={overrideMode} onValueChange={setOverrideMode}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (natural)</SelectItem>
                  <SelectItem value="win">Force Win</SelectItem>
                  <SelectItem value="loss">Force Loss</SelectItem>
                  <SelectItem value="breakeven">Breakeven</SelectItem>
                  <SelectItem value="custom">Custom P&L</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {overrideMode === "custom" && (
              <div className="space-y-1">
                <Label>Target P&L (€)</Label>
                <Input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder="e.g. 500 or -200" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(null)}>Cancel</Button>
            <Button onClick={setOverride}>Apply Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrades;
