import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, Search, CandlestickChart, LineChart,
  ArrowUpRight, ArrowDownRight, Clock, X, ChevronDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// ─── Types ───
interface Asset {
  id: string; symbol: string; name: string; type: string;
  icon_url: string | null; leverage_max: number; enabled: boolean;
  market_hours_start: string | null; market_hours_end: string | null;
  market_days: number[] | null;
}
interface Trade {
  id: string; user_id: string; asset_id: string; direction: string;
  size: number; entry_price: number; current_price: number | null;
  leverage: number; pnl: number | null; status: string;
  order_type: string; stop_loss: number | null; take_profit: number | null;
  opened_at: string; closed_at: string | null;
  assets?: { symbol: string; name: string };
}

// ─── Generate fake candle data ───
function generateCandles(count: number, basePrice: number) {
  const candles: { time: string; o: number; h: number; l: number; c: number; v: number }[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.47) * price * 0.02;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * price * 0.008;
    const low = Math.min(open, close) - Math.random() * price * 0.008;
    const vol = Math.floor(Math.random() * 1000 + 200);
    candles.push({
      time: new Date(now - i * 3600000).toISOString(),
      o: +open.toFixed(2), h: +high.toFixed(2), l: +low.toFixed(2),
      c: +close.toFixed(2), v: vol,
    });
    price = close;
  }
  return candles;
}

// ─── Candlestick / Line chart component ───
function PriceChart({ candles, chartType }: { candles: ReturnType<typeof generateCandles>; chartType: "candle" | "line" }) {
  if (!candles.length) return null;
  const allHigh = Math.max(...candles.map(c => c.h));
  const allLow = Math.min(...candles.map(c => c.l));
  const range = allHigh - allLow || 1;
  const W = 900;
  const H = 340;
  const padY = 20;

  const yScale = (v: number) => padY + ((allHigh - v) / range) * (H - padY * 2);
  const candleW = Math.max(2, (W - 40) / candles.length - 1);

  if (chartType === "line") {
    const pts = candles.map((c, i) => {
      const x = 20 + i * ((W - 40) / candles.length);
      const y = yScale(c.c);
      return `${x},${y}`;
    }).join(" ");
    const lastC = candles[candles.length - 1];
    const fillPts = `${20},${H - padY} ${pts} ${20 + (candles.length - 1) * ((W - 40) / candles.length)},${H - padY}`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map(f => {
          const y = padY + f * (H - padY * 2);
          const price = allHigh - f * range;
          return (
            <g key={f}>
              <line x1={20} y1={y} x2={W - 20} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4" />
              <text x={W - 18} y={y + 4} fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="start">{price.toFixed(2)}</text>
            </g>
          );
        })}
        <polygon points={fillPts} fill="hsl(var(--primary) / 0.08)" />
        <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
        <circle cx={20 + (candles.length - 1) * ((W - 40) / candles.length)} cy={yScale(lastC.c)} r="4" fill="hsl(var(--primary))" />
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map(f => {
        const y = padY + f * (H - padY * 2);
        const price = allHigh - f * range;
        return (
          <g key={f}>
            <line x1={20} y1={y} x2={W - 20} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4" />
            <text x={W - 18} y={y + 4} fill="hsl(var(--muted-foreground))" fontSize="10" textAnchor="start">{price.toFixed(2)}</text>
          </g>
        );
      })}
      {candles.map((c, i) => {
        const x = 20 + i * ((W - 40) / candles.length) + candleW / 2;
        const bullish = c.c >= c.o;
        const color = bullish ? "hsl(var(--success))" : "hsl(var(--destructive))";
        const bodyTop = yScale(Math.max(c.o, c.c));
        const bodyBot = yScale(Math.min(c.o, c.c));
        const bodyH = Math.max(1, bodyBot - bodyTop);
        return (
          <g key={i}>
            <line x1={x} y1={yScale(c.h)} x2={x} y2={yScale(c.l)} stroke={color} strokeWidth="1" />
            <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={bodyH}
              fill={bullish ? color : color} stroke={color} strokeWidth="0.5" rx="0.5" />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main component ───
const Trading = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Selected asset for chart
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [candles, setCandles] = useState<ReturnType<typeof generateCandles>>([]);
  const [livePrice, setLivePrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);

  // Order form
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [orderSize, setOrderSize] = useState("");
  const [leverage, setLeverage] = useState(1);
  const [orderType, setOrderType] = useState("market");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [placing, setPlacing] = useState(false);

  // Asset selector panel
  const [showAssetList, setShowAssetList] = useState(false);

  // Wallet balance
  const [balance, setBalance] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data: a }, { data: openT }, { data: closedT }, { data: wallet }] = await Promise.all([
      supabase.from("assets").select("*").eq("enabled", true).order("symbol"),
      supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", user.id).eq("status", "open").order("opened_at", { ascending: false }),
      supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", user.id).eq("status", "closed").order("closed_at", { ascending: false }).limit(20),
      supabase.from("wallets").select("balance").eq("user_id", user.id).eq("currency", "EUR").maybeSingle(),
    ]);
    setAssets(a ?? []);
    setOpenTrades((openT ?? []) as Trade[]);
    setClosedTrades((closedT ?? []) as Trade[]);
    setBalance(Number(wallet?.balance ?? 0));
    setLoading(false);

    // Auto-select first asset if none selected
    if (!selectedAsset && a && a.length > 0) {
      selectAsset(a[0] as Asset);
    }
  }, [user, selectedAsset]);

  useEffect(() => { fetchData(); }, [user]);

  // Simulate live price updates
  useEffect(() => {
    if (!selectedAsset || !candles.length) return;
    const interval = setInterval(() => {
      setCandles(prev => {
        if (!prev.length) return prev;
        const last = { ...prev[prev.length - 1] };
        const tick = (Math.random() - 0.48) * last.c * 0.001;
        last.c = +(last.c + tick).toFixed(2);
        last.h = Math.max(last.h, last.c);
        last.l = Math.min(last.l, last.c);
        setLivePrice(last.c);
        setPriceChange(+((last.c - prev[0].o) / prev[0].o * 100).toFixed(2));
        return [...prev.slice(0, -1), last];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedAsset, candles.length]);

  const selectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetList(false);
    // Generate chart data based on asset type
    const basePrices: Record<string, number> = {
      BTC: 62500, ETH: 3400, SOL: 145, XRP: 0.52, BNB: 580,
      DOGE: 0.12, ADA: 0.45, DOT: 7.2, LINK: 14.5, AVAX: 35,
    };
    const sym = asset.symbol.replace(/\/.*$/, "").replace("EUR", "");
    const base = basePrices[sym] || (100 + Math.random() * 900);
    const data = generateCandles(60, base);
    setCandles(data);
    const last = data[data.length - 1];
    setLivePrice(last.c);
    setPriceChange(+((last.c - data[0].o) / data[0].o * 100).toFixed(2));
    // Reset order form
    setOrderSize("");
    setLeverage(1);
    setStopLoss("");
    setTakeProfit("");
  };

  const placeTrade = async () => {
    if (!user || !selectedAsset || !orderSize) return;
    const sizeNum = Number(orderSize);
    if (isNaN(sizeNum) || sizeNum <= 0) { toast.error("Enter a valid amount"); return; }
    if (sizeNum > balance) { toast.error("Insufficient balance"); return; }

    setPlacing(true);
    // Debit wallet
    const { data: wallet } = await supabase
      .from("wallets").select("id, balance").eq("user_id", user.id).eq("currency", "EUR").maybeSingle();
    if (!wallet || Number(wallet.balance) < sizeNum) {
      toast.error("Insufficient balance");
      setPlacing(false);
      return;
    }
    await supabase.from("wallets").update({ balance: Number(wallet.balance) - sizeNum }).eq("id", wallet.id);

    const { error } = await supabase.from("trades").insert({
      user_id: user.id,
      asset_id: selectedAsset.id,
      direction,
      size: sizeNum,
      entry_price: livePrice,
      leverage,
      order_type: orderType,
      stop_loss: stopLoss ? Number(stopLoss) : null,
      take_profit: takeProfit ? Number(takeProfit) : null,
    });

    if (error) {
      toast.error("Failed to place order");
    } else {
      toast.success(`${direction.toUpperCase()} ${selectedAsset.symbol} — €${sizeNum.toLocaleString()} at ${leverage}×`);
      setOrderSize("");
      setStopLoss("");
      setTakeProfit("");
      fetchData();
    }
    setPlacing(false);
  };

  const closeTrade = async (trade: Trade) => {
    const pnl = Number(trade.pnl ?? 0);
    await supabase.from("trades").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", trade.id);
    const { data: wallet } = await supabase
      .from("wallets").select("id, balance").eq("user_id", user!.id).eq("currency", "EUR").maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + Number(trade.size) + pnl }).eq("id", wallet.id);
    }
    toast.success("Trade closed");
    fetchData();
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const maxLeverage = selectedAsset?.leverage_max ?? 100;
  const leverageSteps = [1, 2, 5, 10, 25, 50, 100].filter(l => l <= maxLeverage);
  const exposure = orderSize ? Number(orderSize) * leverage : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── TOP BAR: asset selector + price ─── */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Chart + asset info */}
        <div className="flex-1 space-y-3">
          {/* Asset header bar */}
          <Card className="p-0">
            <CardContent className="p-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAssetList(!showAssetList)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  {selectedAsset?.icon_url ? (
                    <img src={selectedAsset.icon_url} alt="" className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                      {selectedAsset?.symbol.slice(0, 2)}
                    </div>
                  )}
                  <span className="font-display font-bold text-sm">{selectedAsset?.symbol}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-display font-bold">
                    €{livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`text-sm font-semibold flex items-center gap-0.5 ${priceChange >= 0 ? "text-success" : "text-destructive"}`}>
                    {priceChange >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {priceChange >= 0 ? "+" : ""}{priceChange}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm" variant={chartType === "candle" ? "default" : "ghost"}
                  onClick={() => setChartType("candle")} className="h-8 w-8 p-0"
                >
                  <CandlestickChart className="h-4 w-4" />
                </Button>
                <Button
                  size="sm" variant={chartType === "line" ? "default" : "ghost"}
                  onClick={() => setChartType("line")} className="h-8 w-8 p-0"
                >
                  <LineChart className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Asset selector dropdown */}
          {showAssetList && (
            <Card className="absolute z-40 w-80 max-h-96 overflow-y-auto shadow-xl">
              <CardContent className="p-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {["all", "crypto", "stock", "forex", "index"].map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                    >{t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>
                <div className="space-y-0.5 max-h-60 overflow-y-auto">
                  {filteredAssets.map(a => (
                    <button key={a.id} onClick={() => selectAsset(a)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-muted transition-colors ${selectedAsset?.id === a.id ? "bg-muted" : ""}`}
                    >
                      {a.icon_url ? (
                        <img src={a.icon_url} alt="" className="h-7 w-7 rounded-full" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">{a.symbol.slice(0, 2)}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{a.symbol}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.name}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{a.type}</Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart */}
          <Card>
            <CardContent className="p-2 md:p-4">
              <div className="h-[300px] md:h-[380px]">
                <PriceChart candles={candles} chartType={chartType} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── ORDER PANEL ─── */}
        <div className="w-full lg:w-80 shrink-0">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display">Place Order</CardTitle>
              <p className="text-xs text-muted-foreground">Balance: €{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Direction */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={direction === "buy" ? "default" : "outline"}
                  onClick={() => setDirection("buy")}
                  className={direction === "buy" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}
                >
                  <TrendingUp className="h-4 w-4 mr-1.5" /> Buy
                </Button>
                <Button
                  variant={direction === "sell" ? "destructive" : "outline"}
                  onClick={() => setDirection("sell")}
                >
                  <TrendingDown className="h-4 w-4 mr-1.5" /> Sell
                </Button>
              </div>

              {/* Order type */}
              <div className="space-y-1.5">
                <Label className="text-xs">Order Type</Label>
                <Select value={orderType} onValueChange={setOrderType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop">Stop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (€)</Label>
                <Input
                  type="number" value={orderSize} onChange={e => setOrderSize(e.target.value)}
                  placeholder="0.00" className="h-9"
                />
                <div className="flex gap-1.5">
                  {[25, 50, 75, 100].map(pct => (
                    <button key={pct} onClick={() => setOrderSize(String(Math.floor(balance * pct / 100)))}
                      className="flex-1 text-[10px] font-medium py-1 rounded bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
                    >{pct}%</button>
                  ))}
                </div>
              </div>

              {/* Leverage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Leverage</Label>
                  <span className="text-xs font-bold text-primary">{leverage}×</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {leverageSteps.map(l => (
                    <button key={l} onClick={() => setLeverage(l)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${leverage === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                    >{l}×</button>
                  ))}
                </div>
              </div>

              {/* SL / TP */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-destructive">Stop Loss</Label>
                  <Input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="—" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-success">Take Profit</Label>
                  <Input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="—" className="h-9 text-sm" />
                </div>
              </div>

              {/* Exposure summary */}
              {exposure > 0 && (
                <div className="bg-muted rounded-lg p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Margin</span>
                    <span className="font-medium">€{Number(orderSize).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Exposure</span>
                    <span className="font-medium">€{exposure.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Entry Price</span>
                    <span className="font-medium">€{livePrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <Button
                className={`w-full font-bold ${direction === "buy" ? "bg-success hover:bg-success/90 text-success-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}`}
                onClick={placeTrade}
                disabled={placing || !orderSize}
              >
                {placing ? "Placing..." : `${direction === "buy" ? "Buy" : "Sell"} ${selectedAsset?.symbol ?? ""}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── POSITIONS & HISTORY ─── */}
      <Tabs defaultValue="positions">
        <TabsList>
          <TabsTrigger value="positions" className="text-sm">
            Open Positions {openTrades.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{openTrades.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">Trade History</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardContent className="p-0">
              {openTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No open positions</p>
                  <p className="text-xs">Select an asset above to start trading</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {["Asset", "Direction", "Size", "Entry", "Current", "Leverage", "P&L", ""].map(h => (
                          <th key={h} className={`p-3 font-medium text-muted-foreground text-xs ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {openTrades.map(t => {
                        const pnl = Number(t.pnl ?? 0);
                        return (
                          <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <span className="font-semibold">{t.assets?.symbol}</span>
                            </td>
                            <td className="p-3">
                              <Badge variant={t.direction === "buy" ? "default" : "destructive"}
                                className={`capitalize text-[10px] ${t.direction === "buy" ? "bg-success/10 text-success border-success/20" : ""}`}
                              >
                                {t.direction === "buy" ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                                {t.direction}
                              </Badge>
                            </td>
                            <td className="p-3">€{Number(t.size).toLocaleString()}</td>
                            <td className="p-3 text-muted-foreground">€{Number(t.entry_price).toFixed(2)}</td>
                            <td className="p-3">€{Number(t.current_price ?? t.entry_price).toFixed(2)}</td>
                            <td className="p-3">{t.leverage}×</td>
                            <td className={`p-3 font-semibold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                              {pnl >= 0 ? "+" : ""}€{pnl.toFixed(2)}
                            </td>
                            <td className="p-3 text-right">
                              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 text-xs h-7 px-2"
                                onClick={() => closeTrade(t)}
                              >
                                <X className="h-3.5 w-3.5 mr-1" /> Close
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              {closedTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No trade history yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {["Asset", "Direction", "Size", "Entry", "Leverage", "P&L", "Closed"].map(h => (
                          <th key={h} className="p-3 font-medium text-muted-foreground text-xs text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {closedTrades.map(t => {
                        const pnl = Number(t.pnl ?? 0);
                        return (
                          <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-semibold">{t.assets?.symbol}</td>
                            <td className="p-3">
                              <Badge variant={t.direction === "buy" ? "default" : "destructive"}
                                className={`capitalize text-[10px] ${t.direction === "buy" ? "bg-success/10 text-success border-success/20" : ""}`}
                              >{t.direction}</Badge>
                            </td>
                            <td className="p-3">€{Number(t.size).toLocaleString()}</td>
                            <td className="p-3 text-muted-foreground">€{Number(t.entry_price).toFixed(2)}</td>
                            <td className="p-3">{t.leverage}×</td>
                            <td className={`p-3 font-semibold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                              {pnl >= 0 ? "+" : ""}€{pnl.toFixed(2)}
                            </td>
                            <td className="p-3 text-muted-foreground text-xs">
                              {t.closed_at ? new Date(t.closed_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Trading;