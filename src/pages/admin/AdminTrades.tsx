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
import { CalendarIcon, Plus, Trash2, TrendingUp, TrendingDown, DollarSign, Layers, Target, Tag, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const toLocalDateTimeInputValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const AdminTrades = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideOpen, setOverrideOpen] = useState<any>(null);
  const [overrideMode, setOverrideMode] = useState("none");
  const [targetValue, setTargetValue] = useState("");
  const [durationSec, setDurationSec] = useState(60);
  const [customDuration, setCustomDuration] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [manipulating, setManipulating] = useState<Record<string, boolean>>({});
  const [manipEndTime, setManipEndTime] = useState<Record<string, number>>({});
  const [countdownTick, setCountdownTick] = useState(0);

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
        .select("id, full_name, email, display_id")
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

  // Countdown tick for manipulation timers
  useEffect(() => {
    const hasActive = Object.values(manipulating).some(Boolean);
    if (!hasActive) return;
    const iv = setInterval(() => setCountdownTick(c => c + 1), 1000);
    return () => clearInterval(iv);
  }, [manipulating]);

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

  // Calculate a realistic price movement for visual display during manipulation
  // The price moves by a believable % (0.5-3%) in the correct direction, NOT derived from P&L
  const calcRealisticTargetPrice = (trade: any, forcedPnl: number, currentPrice: number) => {
    const entry = Number(trade.entry_price);
    if (entry === 0) return entry;
    
    // Determine direction of price movement based on trade direction + win/loss
    const isBuy = trade.direction === "buy";
    const isWin = forcedPnl >= 0;
    const priceGoesUp = (isBuy && isWin) || (!isBuy && !isWin);
    
    // Calculate what the "real" target price would be from the P&L formula
    const size = Number(trade.size);
    const leverage = Number(trade.leverage);
    const realRatio = Math.abs(forcedPnl) / (size * leverage);
    
    // Cap the price movement to a realistic range (0.3% to 5% from current price)
    // Use the real ratio if it's within bounds, otherwise clamp it
    const maxRealisticMove = 0.05; // 5% max
    const minRealisticMove = 0.003; // 0.3% min
    const clampedRatio = Math.max(minRealisticMove, Math.min(realRatio, maxRealisticMove));
    
    return priceGoesUp
      ? currentPrice * (1 + clampedRatio)
      : currentPrice * (1 - clampedRatio);
  };

  const startGradualManipulation = async (trade: any, forcedPnl: number, totalDurationSec: number) => {
    const symbol = trade.assets?.symbol;
    const currentMarketPrice = livePrices[symbol] || Number(trade.entry_price);
    const realisticTargetPrice = calcRealisticTargetPrice(trade, forcedPnl, currentMarketPrice);
    
    const steps = Math.max(Math.round(totalDurationSec / 3), 4);
    const intervalMs = (totalDurationSec * 1000) / steps;
    const priceStep = (realisticTargetPrice - currentMarketPrice) / steps;
    const pnlStep = forcedPnl / steps;
    let step = 0;

    setManipulating(prev => ({ ...prev, [trade.id]: true }));

    // Set override to lock price display
    await supabase.from("trade_overrides").upsert({
      trade_id: trade.id,
      override_mode: forcedPnl >= 0 ? "force_win" : "force_loss",
      target_value: forcedPnl,
      is_active: true,
    }, { onConflict: "trade_id" });

    // Set initial state without jumping pnl
    await supabase.from("trades").update({ 
      current_price: currentMarketPrice,
    }).eq("id", trade.id);

    const timer = setInterval(async () => {
      step++;
      const priceNoise = (Math.random() - 0.5) * Math.abs(priceStep) * 0.3;
      const pnlNoise = (Math.random() - 0.5) * Math.abs(pnlStep) * 0.15;
      
      const isLast = step >= steps;
      const newPrice = isLast
        ? realisticTargetPrice 
        : +(currentMarketPrice + priceStep * step + priceNoise).toFixed(currentMarketPrice < 1 ? 6 : 2);
      const newPnl = isLast
        ? forcedPnl
        : +(pnlStep * step + pnlNoise).toFixed(2);

      await supabase.from("trades").update({ 
        current_price: newPrice,
        pnl: newPnl,
      }).eq("id", trade.id);

      if (isLast) {
        clearInterval(timer);

        const { data: currentTrade } = await supabase
          .from("trades").select("status").eq("id", trade.id).maybeSingle();
        
        if (currentTrade?.status === "closed") {
          setManipulating(prev => ({ ...prev, [trade.id]: false }));
          toast.success(`Manipulation complete — client already closed with target P&L`);
          fetchTrades();
          return;
        }

        // Close the trade with realistic close price + desired P&L
        await supabase.from("trades").update({
          status: "closed",
          closed_at: new Date().toISOString(),
          current_price: realisticTargetPrice,
          pnl: forcedPnl,
        }).eq("id", trade.id);

        // Deactivate override
        await supabase.from("trade_overrides").update({ is_active: false }).eq("trade_id", trade.id);

        // Credit/debit wallet
        const { data: wallet } = await supabase
          .from("wallets")
          .select("id, balance")
          .eq("user_id", trade.user_id)
          .eq("currency", "EUR")
          .maybeSingle();
        if (wallet) {
          await supabase.from("wallets").update({
            balance: Number(wallet.balance) + Number(trade.size) + forcedPnl,
          }).eq("id", wallet.id);
        }

        setManipulating(prev => ({ ...prev, [trade.id]: false }));
        toast.success(`Manipulation complete — Trade closed with P&L €${forcedPnl.toFixed(2)}`);
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
        const usesExactFinishAt = customDuration === "custom" && !!endDateTime;
        const dur = resolvedDuration ?? (usesExactFinishAt
          ? Math.round((new Date(endDateTime).getTime() - Date.now()) / 1000)
          : durationSec);
        const finalDur = Math.max(5, dur);
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
      // Remove override — reset current_price and pnl so live calculation takes over
      await supabase.from("trades").update({ current_price: null, pnl: 0 }).eq("id", trade.id);
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

  // Bulk trade creator — step wizard
  type BulkTradeRow = { asset_id: string; direction: string; size: string; leverage: string; pnl: string; closedAt: Date; entryPrice: string };
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStep, setBulkStep] = useState<"client" | "trade" | "review">("client");
  const [bulkUserId, setBulkUserId] = useState("");
  const [bulkUsers, setBulkUsers] = useState<any[]>([]);
  const [bulkAssets, setBulkAssets] = useState<any[]>([]);
  const [bulkRows, setBulkRows] = useState<BulkTradeRow[]>([]);
  const [bulkCurrentRow, setBulkCurrentRow] = useState<BulkTradeRow>({ asset_id: "", direction: "buy", size: "1000", leverage: "1", pnl: "50", closedAt: new Date(), entryPrice: "" });
  const [bulkSaving, setBulkSaving] = useState(false);

  const openBulkDialog = async () => {
    const [{ data: users }, { data: assets }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").order("full_name"),
      supabase.from("assets").select("id, symbol, name").eq("enabled", true).order("symbol"),
    ]);
    setBulkUsers(users ?? []);
    setBulkAssets(assets ?? []);
    setBulkUserId("");
    setBulkRows([]);
    setBulkCurrentRow({ asset_id: "", direction: "buy", size: "1000", leverage: "1", pnl: "50", closedAt: new Date(), entryPrice: "" });
    setBulkStep("client");
    setBulkOpen(true);
  };

  const addCurrentTradeAndContinue = () => {
    if (!bulkCurrentRow.asset_id) { toast.error("Select an asset"); return; }
    if (!bulkCurrentRow.size) { toast.error("Enter a size"); return; }
    setBulkRows(prev => [...prev, { ...bulkCurrentRow }]);
    // Reset for next trade, keep same date for convenience
    setBulkCurrentRow({ asset_id: "", direction: "buy", size: "1000", leverage: "1", pnl: "50", closedAt: bulkCurrentRow.closedAt, entryPrice: "" });
  };

  const finishAndReview = () => {
    // If current row has data, add it first
    if (bulkCurrentRow.asset_id && bulkCurrentRow.size) {
      setBulkRows(prev => [...prev, { ...bulkCurrentRow }]);
    }
    setBulkStep("review");
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
    // Priority: 1) closed = stored pnl, 2) active override = target_value,
    // 3) admin-set current_price with stored pnl (manipulation done) = stored pnl,
    // 4) live market calculation
    const hasActiveOverride = override?.is_active && override?.override_mode !== "none" && override?.target_value != null;
    const hasAdminLockedPnl = !isClosed && t.current_price != null && t.pnl != null && Number(t.pnl) !== 0;
    const pnl = isClosed
      ? Number(t.pnl ?? 0)
      : hasActiveOverride
        ? Number(override.target_value)
        : hasAdminLockedPnl
          ? Number(t.pnl)
          : computeLivePnl(t, livePrices[symbol]);
    return (
      <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
        <td className="p-3">
          <p className="font-medium text-xs">{t.profiles?.full_name || "—"}</p>
        </td>
        <td className="p-3">
          <span className="font-mono text-xs text-muted-foreground">{t.profiles?.display_id ?? "—"}</span>
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
              const def = new Date(Date.now() + 60000);
              setEndDateTime(def.toISOString().slice(0, 16));
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
      {["Client", "Trade ID", "Asset", "Direction", "Size", "Qty", "Entry", "Close Price", "Leverage", "P&L", "Override", ""].map(h => (
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
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" /> Duration / Finish At
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "5m", sec: 300 },
                    { label: "15m", sec: 900 },
                    { label: "30m", sec: 1800 },
                    { label: "1h", sec: 3600 },
                    { label: "2h", sec: 7200 },
                    { label: "4h", sec: 14400 },
                    { label: "8h", sec: 28800 },
                    { label: "24h", sec: 86400 },
                  ].map((preset) => {
                    const isActive = durationSec === preset.sec && !customDuration;
                    return (
                      <Button
                        key={preset.label}
                        type="button"
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        className="text-xs h-8 px-3"
                        onClick={() => {
                          setDurationSec(preset.sec);
                          setCustomDuration("");
                          const dt = new Date(Date.now() + preset.sec * 1000);
                          setEndDateTime(toLocalDateTimeInputValue(dt));
                        }}
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  <span>or pick exact date & time</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <Input
                  type="datetime-local"
                  className="h-11"
                  value={endDateTime}
                  min={toLocalDateTimeInputValue(new Date())}
                  onChange={(e) => {
                    setEndDateTime(e.target.value);
                    const diffSec = Math.round((new Date(e.target.value).getTime() - Date.now()) / 1000);
                    setDurationSec(Math.max(5, diffSec));
                    setCustomDuration("custom");
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Trade will close at target P&L in
                  <span className="font-medium text-foreground ml-1">
                    {durationSec >= 3600 ? `${Math.floor(durationSec / 3600)}h ${Math.floor((durationSec % 3600) / 60)}m` : durationSec >= 60 ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s` : `${durationSec}s`}
                  </span>
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

      {/* Bulk Trade Creator — Step Wizard */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bulkStep === "client" ? "Step 1: Select Client" : bulkStep === "trade" ? `Step 2: Add Trade #${bulkRows.length + 1}` : "Step 3: Review & Create"}
            </DialogTitle>
          </DialogHeader>

          {/* STEP 1: Select Client */}
          {bulkStep === "client" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Choose which client these trades belong to.</p>
              <Select value={bulkUserId} onValueChange={setBulkUserId}>
                <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                <SelectContent>
                  {bulkUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email || u.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                <Button onClick={() => { if (!bulkUserId) { toast.error("Select a client"); return; } setBulkStep("trade"); }} disabled={!bulkUserId}>
                  Next →
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* STEP 2: Add Trade */}
          {bulkStep === "trade" && (
            <div className="space-y-5">
              {bulkRows.length > 0 && (
                <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <p className="text-sm font-semibold text-success">{bulkRows.length} trade(s) ready</p>
                  </div>
                  {bulkRows.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1">
                      <span className="text-muted-foreground">{bulkAssets.find(a => a.id === r.asset_id)?.symbol} · {r.direction.toUpperCase()} · €{r.size} · P&L €{r.pnl}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={() => setBulkRows(prev => prev.filter((_, j) => j !== i))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                {/* Asset & Direction — big and obvious */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <Tag className="h-4 w-4 text-primary" /> Asset
                    </Label>
                    <Select value={bulkCurrentRow.asset_id} onValueChange={v => setBulkCurrentRow(r => ({ ...r, asset_id: v }))}>
                      <SelectTrigger className="h-12 text-base"><SelectValue placeholder="Pick asset..." /></SelectTrigger>
                      <SelectContent>
                        {bulkAssets.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.symbol} — {a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" /> Direction
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={bulkCurrentRow.direction === "buy" ? "default" : "outline"}
                        className={cn("h-12 text-base font-semibold", bulkCurrentRow.direction === "buy" && "bg-success hover:bg-success/90 text-success-foreground")}
                        onClick={() => setBulkCurrentRow(r => ({ ...r, direction: "buy" }))}
                      >
                        <TrendingUp className="h-5 w-5 mr-2" /> BUY
                      </Button>
                      <Button
                        type="button"
                        variant={bulkCurrentRow.direction === "sell" ? "default" : "outline"}
                        className={cn("h-12 text-base font-semibold", bulkCurrentRow.direction === "sell" && "bg-destructive hover:bg-destructive/90 text-destructive-foreground")}
                        onClick={() => setBulkCurrentRow(r => ({ ...r, direction: "sell" }))}
                      >
                        <TrendingDown className="h-5 w-5 mr-2" /> SELL
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Size, Leverage, P&L — clear labels with icons */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-primary" /> Size (€)
                    </Label>
                    <Input className="h-12 text-base font-medium" type="number" value={bulkCurrentRow.size} onChange={e => setBulkCurrentRow(r => ({ ...r, size: e.target.value }))} placeholder="1000" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" /> Leverage
                    </Label>
                    <Input className="h-12 text-base font-medium" type="number" value={bulkCurrentRow.leverage} onChange={e => setBulkCurrentRow(r => ({ ...r, leverage: e.target.value }))} min="1" placeholder="1" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-primary" /> P&L (€)
                    </Label>
                    <Input className="h-12 text-base font-medium" type="number" value={bulkCurrentRow.pnl} onChange={e => setBulkCurrentRow(r => ({ ...r, pnl: e.target.value }))} placeholder="+50 or -100" />
                  </div>
                </div>

                {/* Entry Price & Close Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-muted-foreground" /> Entry Price
                      <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
                    </Label>
                    <Input className="h-12 text-base" type="number" value={bulkCurrentRow.entryPrice} onChange={e => setBulkCurrentRow(r => ({ ...r, entryPrice: e.target.value }))} placeholder="Auto from market" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-primary" /> Close Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("h-12 w-full justify-start text-left text-base font-normal", !bulkCurrentRow.closedAt && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {bulkCurrentRow.closedAt ? format(bulkCurrentRow.closedAt, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={bulkCurrentRow.closedAt} onSelect={d => d && setBulkCurrentRow(r => ({ ...r, closedAt: d }))} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Action buttons — big and clear */}
              <div className="flex items-center gap-3 pt-2">
                <Button variant="outline" onClick={() => setBulkStep("client")} className="h-11">
                  ← Back
                </Button>
                <div className="flex-1" />
                <Button variant="secondary" onClick={addCurrentTradeAndContinue} className="h-11 text-sm font-semibold">
                  <Plus className="h-4 w-4 mr-1.5" /> Add & Next Trade
                </Button>
                <Button onClick={finishAndReview} className="h-11 text-sm font-semibold">
                  Done <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {bulkStep === "review" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Creating <span className="font-semibold text-foreground">{bulkRows.length}</span> trade(s) for <span className="font-semibold text-foreground">{bulkUsers.find(u => u.id === bulkUserId)?.full_name || "Client"}</span>
              </p>
              <div className="rounded-lg border divide-y">
                {bulkRows.map((r, i) => {
                  const assetSymbol = bulkAssets.find(a => a.id === r.asset_id)?.symbol ?? "—";
                  const pnlNum = Number(r.pnl);
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-4">#{i + 1}</span>
                        <span className="font-medium">{assetSymbol}</span>
                        <Badge variant={r.direction === "buy" ? "default" : "destructive"} className="text-xs capitalize">{r.direction}</Badge>
                        <span className="text-muted-foreground">€{r.size} · {r.leverage}×</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${pnlNum >= 0 ? "text-success" : "text-destructive"}`}>
                          {pnlNum >= 0 ? "+" : ""}€{r.pnl}
                        </span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={() => {
                          setBulkRows(prev => prev.filter((_, j) => j !== i));
                          if (bulkRows.length <= 1) setBulkStep("trade");
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-md bg-muted/50 p-2 text-sm">
                <span className="text-muted-foreground">Total wallet impact: </span>
                <span className="font-semibold">
                  €{bulkRows.reduce((s, r) => s + Number(r.size) + Number(r.pnl), 0).toLocaleString()}
                </span>
              </div>
              <DialogFooter className="flex gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setBulkStep("trade")} size="sm">← Add More</Button>
                <div className="flex-1" />
                <Button variant="outline" onClick={() => setBulkOpen(false)} size="sm">Cancel</Button>
                <Button onClick={submitBulkTrades} disabled={bulkSaving || bulkRows.length === 0} size="sm">
                  {bulkSaving ? "Creating..." : `Create ${bulkRows.length} Trade(s)`}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrades;
