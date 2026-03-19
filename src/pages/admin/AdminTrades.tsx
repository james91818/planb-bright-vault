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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminTrades = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideOpen, setOverrideOpen] = useState<any>(null);
  const [overrideMode, setOverrideMode] = useState("none");
  const [targetValue, setTargetValue] = useState("");
  const [durationSec, setDurationSec] = useState(60);
  const [customDuration, setCustomDuration] = useState("");
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [manipulating, setManipulating] = useState<Record<string, boolean>>({});

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

  // Realtime subscription for trade changes
  useEffect(() => {
    const channel = supabase
      .channel('admin-trades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => {
        fetchTrades();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fetch live prices for P&L every 2 seconds
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
    const interval = setInterval(refreshPrices, 2000);
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

  // Calculate target price from desired P&L
  const calcTargetPrice = (trade: any, pnl: number) => {
    const entry = Number(trade.entry_price);
    const size = Number(trade.size);
    const leverage = Number(trade.leverage);
    if (size === 0 || leverage === 0 || entry === 0) return entry;
    // pnl = ((targetPrice - entry) / entry) * size * leverage  [for buy]
    // targetPrice = entry * (1 + pnl / (size * leverage))
    const ratio = pnl / (size * leverage);
    return trade.direction === "buy"
      ? entry * (1 + ratio)
      : entry * (1 - ratio);
  };

  const startGradualManipulation = async (trade: any, forcedPnl: number, totalDurationSec: number) => {
    const targetPrice = calcTargetPrice(trade, forcedPnl);
    const symbol = trade.assets?.symbol;
    const currentMarketPrice = livePrices[symbol] || Number(trade.entry_price);
    const steps = Math.max(Math.round(totalDurationSec / 3), 4);
    const intervalMs = (totalDurationSec * 1000) / steps;
    const priceStep = (targetPrice - currentMarketPrice) / steps;
    let step = 0;

    setManipulating(prev => ({ ...prev, [trade.id]: true }));

    await supabase.from("trades").update({ 
      current_price: currentMarketPrice,
      pnl: forcedPnl,
    }).eq("id", trade.id);

    const timer = setInterval(async () => {
      step++;
      const noise = (Math.random() - 0.5) * Math.abs(priceStep) * 0.3;
      const newPrice = currentMarketPrice + priceStep * step + (step < steps ? noise : 0);
      const finalPrice = step >= steps ? targetPrice : +newPrice.toFixed(newPrice < 1 ? 6 : 2);

      await supabase.from("trades").update({ current_price: finalPrice }).eq("id", trade.id);

      if (step >= steps) {
        clearInterval(timer);

        const { data: currentTrade } = await supabase
          .from("trades").select("status").eq("id", trade.id).maybeSingle();
        
        if (currentTrade?.status === "closed") {
          setManipulating(prev => ({ ...prev, [trade.id]: false }));
          toast.success(`Manipulation complete — client already closed with target P&L`);
          fetchTrades();
          return;
        }

        // Keep trade open — just lock in the manipulated price and P&L
        await supabase.from("trades").update({
          current_price: targetPrice,
          pnl: forcedPnl,
        }).eq("id", trade.id);

        setManipulating(prev => ({ ...prev, [trade.id]: false }));
        toast.success(`Manipulation complete — P&L locked at €${forcedPnl.toFixed(2)}. Trade remains open.`);
        fetchTrades();
      }
    }, intervalMs);
  };

  const setOverride = async (resolvedDuration?: number) => {
    if (!overrideOpen) return;
    const trade = overrideOpen;

    // Save the override record
    const existing = trade.trade_overrides;
    if (existing && existing.length > 0) {
      await supabase.from("trade_overrides").update({
        override_mode: overrideMode,
        target_value: targetValue ? Number(targetValue) : null,
        applied_by: user?.id,
        is_active: overrideMode !== "none",
      }).eq("id", existing[0].id);
    } else {
      await supabase.from("trade_overrides").insert({
        trade_id: trade.id,
        override_mode: overrideMode,
        target_value: targetValue ? Number(targetValue) : null,
        applied_by: user?.id,
        is_active: overrideMode !== "none",
      });
    }

    if (overrideMode !== "none") {
      let forcedPnl = 0;
      const size = Number(trade.size);
      if (overrideMode === "win") {
        forcedPnl = targetValue ? Math.abs(Number(targetValue)) : Math.abs(size * 0.15);
      } else if (overrideMode === "loss") {
        forcedPnl = targetValue ? -Math.abs(Number(targetValue)) : -(size * 0.15);
      } else if (overrideMode === "breakeven") {
        forcedPnl = 0;
      } else if (overrideMode === "custom") {
        forcedPnl = targetValue ? Number(targetValue) : 0;
      }

      if (trade.status === "open") {
        const dur = resolvedDuration ?? durationSec;
        const finalDur = dur === -1 ? Math.max(5, Number(customDuration) || 60) : dur;
        toast.info(`Starting manipulation — P&L will reach €${forcedPnl.toFixed(2)} over ${finalDur}s. Stay on this page.`);
        startGradualManipulation(trade, forcedPnl, finalDur);
      } else {
        // Already closed — update P&L directly
        const oldPnl = Number(trade.pnl ?? 0);
        const diff = forcedPnl - oldPnl;
        await supabase.from("trades").update({ pnl: forcedPnl }).eq("id", trade.id);
        if (diff !== 0) {
          const { data: wallet } = await supabase
            .from("wallets").select("id, balance")
            .eq("user_id", trade.user_id).eq("currency", "EUR").maybeSingle();
          if (wallet) {
            await supabase.from("wallets").update({
              balance: Number(wallet.balance) + diff,
            }).eq("id", wallet.id);
          }
        }
        toast.success(`Trade P&L updated to €${forcedPnl.toFixed(2)}`);
        fetchTrades();
      }
    } else {
      // Remove override — reset current_price to null
      await supabase.from("trades").update({ current_price: null }).eq("id", trade.id);
      toast.success("Override removed");
      fetchTrades();
    }

    setOverrideOpen(null);
  };

  const openTrades = trades.filter(t => t.status === "open");
  const closedTrades = trades.filter(t => t.status === "closed");

  const editClosedPnl = async (trade: any, newPnl: number) => {
    // Update trade P&L
    await supabase.from("trades").update({ pnl: newPnl }).eq("id", trade.id);
    // Adjust wallet: remove old pnl, apply new
    const oldPnl = Number(trade.pnl ?? 0);
    const diff = newPnl - oldPnl;
    if (diff !== 0) {
      const { data: wallet } = await supabase
        .from("wallets").select("id, balance")
        .eq("user_id", trade.user_id).eq("currency", "EUR").maybeSingle();
      if (wallet) {
        await supabase.from("wallets").update({
          balance: Number(wallet.balance) + diff,
        }).eq("id", wallet.id);
      }
    }
    toast.success("Trade P&L updated");
    fetchTrades();
  };

  // Edit closed trade dialog
  const [editPnlOpen, setEditPnlOpen] = useState<any>(null);
  const [editPnlValue, setEditPnlValue] = useState("");

  // Bulk trade creator
  type BulkTradeRow = { asset_id: string; direction: string; size: string; leverage: string; pnl: string; closedAt: Date; entryPrice: string };
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkUserId, setBulkUserId] = useState("");
  const [bulkUsers, setBulkUsers] = useState<any[]>([]);
  const [bulkAssets, setBulkAssets] = useState<any[]>([]);
  const [bulkRows, setBulkRows] = useState<BulkTradeRow[]>([
    { asset_id: "", direction: "buy", size: "1000", leverage: "1", pnl: "50", closedAt: new Date(), entryPrice: "" },
  ]);
  const [bulkSaving, setBulkSaving] = useState(false);

  const openBulkDialog = async () => {
    const [{ data: users }, { data: assets }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
      supabase.from("assets").select("id, symbol, name").eq("enabled", true).order("symbol"),
    ]);
    setBulkUsers(users ?? []);
    setBulkAssets(assets ?? []);
    setBulkUserId("");
    setBulkRows([{ asset_id: "", direction: "buy", size: "1000", leverage: "1", pnl: "50", closedAt: new Date(), entryPrice: "" }]);
    setBulkOpen(true);
  };

  const addBulkRow = () => {
    setBulkRows(prev => [...prev, { asset_id: "", direction: "buy", size: "1000", leverage: "1", pnl: "50", closedAt: new Date(), entryPrice: "" }]);
  };

  const updateBulkRow = (idx: number, field: keyof BulkTradeRow, value: any) => {
    setBulkRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeBulkRow = (idx: number) => {
    setBulkRows(prev => prev.filter((_, i) => i !== idx));
  };

  const submitBulkTrades = async () => {
    if (!bulkUserId) { toast.error("Select a client"); return; }
    const validRows = bulkRows.filter(r => r.asset_id && r.size && r.pnl);
    if (!validRows.length) { toast.error("Add at least one valid trade"); return; }

    setBulkSaving(true);
    let totalPnlDelta = 0;

    for (const row of validRows) {
      const entryPrice = row.entryPrice ? Number(row.entryPrice) : (livePrices[bulkAssets.find(a => a.id === row.asset_id)?.symbol] || 0);
      const size = Number(row.size);
      const pnl = Number(row.pnl);
      const leverage = Number(row.leverage) || 1;

      const { error } = await supabase.from("trades").insert({
        user_id: bulkUserId,
        asset_id: row.asset_id,
        direction: row.direction,
        size,
        leverage,
        entry_price: entryPrice,
        current_price: entryPrice,
        pnl,
        status: "closed",
        opened_at: row.closedAt.toISOString(),
        closed_at: row.closedAt.toISOString(),
      });

      if (error) {
        toast.error(`Failed to create trade: ${error.message}`);
        setBulkSaving(false);
        return;
      }

      totalPnlDelta += size + pnl;
    }

    // Credit wallet with total size + pnl
    const { data: wallet } = await supabase.from("wallets").select("id, balance").eq("user_id", bulkUserId).eq("currency", "EUR").maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + totalPnlDelta }).eq("id", wallet.id);
    }

    toast.success(`${validRows.length} trade(s) created`);
    setBulkSaving(false);
    setBulkOpen(false);
    fetchTrades();
  };

  const renderTradeRow = (t: any, isClosed: boolean) => {
    const override = t.trade_overrides?.[0];
    const symbol = t.assets?.symbol;
    // If there's an active override with a target P&L, use that instead of live price
    const hasActiveOverride = override?.is_active && override?.override_mode !== "none" && override?.target_value != null;
    const pnl = isClosed
      ? Number(t.pnl ?? 0)
      : hasActiveOverride
        ? Number(override.target_value)
        : computeLivePnl(t, livePrices[symbol]);
    return (
      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
        <td className="p-3">
          <p className="font-medium text-xs">{t.profiles?.full_name || "—"}</p>
        </td>
        <td className="p-3 font-medium">{symbol ?? "—"}</td>
        <td className="p-3">
          <Badge variant={t.direction === "buy" ? "default" : "destructive"} className="text-xs capitalize">
            {t.direction}
          </Badge>
        </td>
        <td className="p-3">€{Number(t.size).toLocaleString()}</td>
        <td className="p-3 text-muted-foreground">{Number(t.entry_price) > 0 ? (Number(t.size) / Number(t.entry_price)).toFixed(Number(t.entry_price) > 100 ? 6 : 4) : "—"} {symbol}</td>
        <td className="p-3">€{Number(t.entry_price).toFixed(2)}</td>
        <td className="p-3">{t.current_price ? `€${Number(t.current_price).toFixed(2)}` : <span className="text-muted-foreground">—</span>}</td>
        <td className="p-3">{t.leverage}×</td>
        <td className={`p-3 font-semibold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
          {pnl >= 0 ? "+" : ""}€{pnl.toFixed(2)}
        </td>
        <td className="p-3">
          {override?.is_active ? (
            <Badge className="text-xs bg-warning/10 text-warning border-warning/30">
              {override.override_mode}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
        <td className="p-3 text-right space-x-1">
          {manipulating[t.id] ? (
            <Badge className="text-xs bg-primary/10 text-primary border-primary/30 animate-pulse">
              Manipulating...
            </Badge>
          ) : (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
              setOverrideOpen(t);
              setOverrideMode(override?.override_mode ?? "none");
              setTargetValue(override?.target_value?.toString() ?? "");
              setDurationSec(60);
              setCustomDuration("");
            }}>
              Override
            </Button>
          )}
          {!isClosed && (
            <Button size="sm" variant="destructive" className="text-xs h-7" onClick={() => closeTrade(t, pnl)}>
              Close
            </Button>
          )}
          {isClosed && (
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => {
              setEditPnlOpen(t);
              setEditPnlValue(String(Number(t.pnl ?? 0)));
            }}>
              Edit P&L
            </Button>
          )}
        </td>
      </tr>
    );
  };

  const tableHeaders = (
    <tr className="border-b bg-muted/50">
      {["Client", "Asset", "Direction", "Size", "Qty", "Entry", "Close Price", "Leverage", "P&L", "Override", ""].map(h => (
        <th key={h} className={`p-3 font-medium text-muted-foreground text-xs uppercase tracking-wider ${h === "" ? "text-right" : "text-left"}`}>{h || "Actions"}</th>
      ))}
    </tr>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Trades</h1>
          <p className="text-muted-foreground text-sm">View and manage all client trades</p>
        </div>
        <Button onClick={openBulkDialog} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Create Trades
        </Button>
      </div>

      {/* Open Trades */}
      <div>
        <h2 className="text-base font-display font-semibold mb-2 flex items-center gap-2">
          Open Positions
          {openTrades.length > 0 && <Badge variant="secondary" className="text-[10px] px-1.5">{openTrades.length}</Badge>}
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>{tableHeaders}</thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : openTrades.length === 0 ? (
                    <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No open trades</td></tr>
                  ) : (
                    openTrades.map(t => renderTradeRow(t, false))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Closed Trades */}
      <div>
        <h2 className="text-base font-display font-semibold mb-2 flex items-center gap-2">
          Closed Trades
          {closedTrades.length > 0 && <Badge variant="secondary" className="text-[10px] px-1.5">{closedTrades.length}</Badge>}
        </h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>{tableHeaders}</thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : closedTrades.length === 0 ? (
                    <tr><td colSpan={11} className="p-8 text-center text-muted-foreground">No closed trades</td></tr>
                  ) : (
                    closedTrades.map(t => renderTradeRow(t, true))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

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
            {(overrideMode === "custom" || overrideMode === "win" || overrideMode === "loss") && (
              <div className="space-y-1">
                <Label>Target P&L (€)</Label>
                <Input type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={overrideMode === "loss" ? "e.g. -200" : overrideMode === "win" ? "e.g. 500" : "e.g. 500 or -200"} />
                <p className="text-xs text-muted-foreground">
                  {overrideMode === "win" ? "Enter the profit amount the client should receive" : overrideMode === "loss" ? "Enter the loss amount (use negative, e.g. -200)" : "Positive for profit, negative for loss"}
                </p>
              </div>
            )}
            {overrideMode !== "none" && overrideOpen?.status === "open" && (
              <div className="space-y-1">
                <Label>Manipulation Duration</Label>
                <Select value={String(durationSec)} onValueChange={(v) => {
                  if (v === "custom") {
                    setDurationSec(-1);
                    setCustomDuration("");
                  } else {
                    setDurationSec(Number(v));
                  }
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {durationSec === -1 && (
                  <div className="mt-2">
                    <Input type="number" value={customDuration} onChange={(e) => setCustomDuration(e.target.value)}
                      placeholder="Duration in seconds" min={5} />
                    <p className="text-xs text-muted-foreground mt-1">Enter duration in seconds (min 5)</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  How long the price will gradually drift to reach the target P&L
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(null)}>Cancel</Button>
            <Button onClick={() => setOverride()}>Apply Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Closed P&L Dialog */}
      <Dialog open={!!editPnlOpen} onOpenChange={() => setEditPnlOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Closed Trade P&L</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Change the final P&L of this closed trade. The client's wallet balance will be adjusted accordingly.
            </p>
            <div className="space-y-1">
              <Label>Current P&L</Label>
              <p className="text-sm font-semibold">€{Number(editPnlOpen?.pnl ?? 0).toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <Label>New P&L (€)</Label>
              <Input type="number" value={editPnlValue} onChange={(e) => setEditPnlValue(e.target.value)} placeholder="e.g. 500 or -200" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPnlOpen(null)}>Cancel</Button>
            <Button onClick={() => {
              if (editPnlOpen && editPnlValue) {
                editClosedPnl(editPnlOpen, Number(editPnlValue));
                setEditPnlOpen(null);
              }
            }}>Update P&L</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrades;
