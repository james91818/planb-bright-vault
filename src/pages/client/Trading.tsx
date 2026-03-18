import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { computeLivePnl } from "@/lib/tradePnl";
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
  TrendingUp, TrendingDown, Search, CandlestickChart, LineChart as LineChartIcon,
  ArrowUpRight, ArrowDownRight, Clock, X, ChevronDown, Bot, Send, Loader2, AlertTriangle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

// ─── Local crypto icon map ───
import btcIcon from "@/assets/crypto/btc.png";
import ethIcon from "@/assets/crypto/eth.png";
import solIcon from "@/assets/crypto/sol.png";
import xrpIcon from "@/assets/crypto/xrp.png";
import bnbIcon from "@/assets/crypto/bnb.png";
import dogeIcon from "@/assets/crypto/doge.png";
import adaIcon from "@/assets/crypto/ada.png";
import dotIcon from "@/assets/crypto/dot.png";
import linkIcon from "@/assets/crypto/link.png";
import avaxIcon from "@/assets/crypto/avax.png";

const cryptoIcons: Record<string, string> = {
  BTC: btcIcon, ETH: ethIcon, SOL: solIcon, XRP: xrpIcon, BNB: bnbIcon,
  DOGE: dogeIcon, ADA: adaIcon, DOT: dotIcon, LINK: linkIcon, AVAX: avaxIcon,
};

function getAssetIcon(symbol: string, iconUrl: string | null): string | null {
  const sym = symbol.replace(/\/.*$/, "").replace("EUR", "").replace("USD", "").replace("USDT", "");
  return cryptoIcons[sym] || iconUrl || null;
}

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
type ChatMsg = { role: "user" | "assistant"; content: string };

// ─── Timeframes ───
type Timeframe = "1H" | "4H" | "1D" | "1W" | "1M";
const TIMEFRAME_CONFIG: Record<Timeframe, { count: number; intervalMs: number; label: string }> = {
  "1H": { count: 60, intervalMs: 60_000, label: "1H" },
  "4H": { count: 48, intervalMs: 5 * 60_000, label: "4H" },
  "1D": { count: 48, intervalMs: 30 * 60_000, label: "1D" },
  "1W": { count: 56, intervalMs: 3 * 3600_000, label: "1W" },
  "1M": { count: 60, intervalMs: 12 * 3600_000, label: "1M" },
};

// ─── Market hours check ───
function isMarketOpen(asset: Asset): boolean {
  if (asset.type === "crypto") return true; // Crypto is 24/7
  const now = new Date();
  const utcDay = now.getUTCDay();
  const marketDays = asset.market_days ?? [1, 2, 3, 4, 5];
  if (!marketDays.includes(utcDay)) return false;
  if (asset.market_hours_start && asset.market_hours_end) {
    const [sh, sm] = asset.market_hours_start.split(":").map(Number);
    const [eh, em] = asset.market_hours_end.split(":").map(Number);
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (utcMinutes < startMin || utcMinutes >= endMin) return false;
  }
  return true;
}

// ─── Candle generation ───
// Generates candles that END at basePrice (the real market price)
function generateCandles(count: number, basePrice: number, intervalMs = 3600000) {
  const candles: { time: string; o: number; h: number; l: number; c: number }[] = [];
  const now = Date.now();
  const volatility = intervalMs > 3600000 ? 0.008 : 0.005;

  // Build prices backwards from basePrice
  const prices: number[] = [basePrice];
  let p = basePrice;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * p * volatility;
    p = p - change; // go backwards
    prices.unshift(p);
  }

  // Now create candles from the price path (prices[i] -> prices[i+1])
  for (let i = 0; i < count; i++) {
    const open = prices[i];
    const close = prices[i + 1];
    const high = Math.max(open, close) + Math.random() * Math.abs(close) * 0.002;
    const low = Math.min(open, close) - Math.random() * Math.abs(close) * 0.002;
    candles.push({
      time: new Date(now - (count - i) * intervalMs).toISOString(),
      o: +open.toFixed(open < 1 ? 6 : 2),
      h: +high.toFixed(high < 1 ? 6 : 2),
      l: +low.toFixed(low < 1 ? 6 : 2),
      c: +close.toFixed(close < 1 ? 6 : 2),
    });
  }
  return candles;
}

// ─── Chart ───
function PriceChart({ candles, chartType }: { candles: ReturnType<typeof generateCandles>; chartType: "candle" | "line" }) {
  if (!candles.length) return null;
  const allHigh = Math.max(...candles.map(c => c.h));
  const allLow = Math.min(...candles.map(c => c.l));
  const range = allHigh - allLow || 1;
  const W = 960, H = 380, padTop = 24, padBot = 24, padLeft = 12, padRight = 80;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBot;
  const yScale = (v: number) => padTop + ((allHigh - v) / range) * chartH;
  const candleW = Math.max(2, chartW / candles.length - 1);

  // Price label formatting
  const fmtPrice = (p: number) => {
    if (p >= 10000) return p.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (p >= 100) return p.toFixed(1);
    if (p >= 1) return p.toFixed(2);
    return p.toFixed(4);
  };

  // Grid lines at 0%, 25%, 50%, 75%, 100%
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: padTop + f * chartH,
    price: allHigh - f * range,
  }));

  const renderGrid = () => gridLines.map((g, i) => (
    <g key={i}>
      <line x1={padLeft} y1={g.y} x2={padLeft + chartW} y2={g.y} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4 3" />
      <text x={W - 6} y={g.y + 4} fill="hsl(var(--muted-foreground))" fontSize="11" fontFamily="Inter, sans-serif" textAnchor="end">{fmtPrice(g.price)}</text>
    </g>
  ));

  // Current price line
  const lastPrice = candles[candles.length - 1].c;
  const lastY = yScale(lastPrice);
  const priceLineColor = candles[candles.length - 1].c >= candles[0].o ? "hsl(var(--success))" : "hsl(var(--destructive))";

  if (chartType === "line") {
    const pts = candles.map((c, i) => {
      const x = padLeft + i * (chartW / candles.length) + (chartW / candles.length) / 2;
      return `${x},${yScale(c.c)}`;
    }).join(" ");
    const firstX = padLeft + (chartW / candles.length) / 2;
    const lastX = padLeft + (candles.length - 1) * (chartW / candles.length) + (chartW / candles.length) / 2;
    const fillPts = `${firstX},${padTop + chartH} ${pts} ${lastX},${padTop + chartH}`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {renderGrid()}
        <polygon points={fillPts} fill="hsl(var(--primary) / 0.06)" />
        <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinejoin="round" />
        {/* Current price dashed line */}
        <line x1={padLeft} y1={lastY} x2={padLeft + chartW} y2={lastY} stroke={priceLineColor} strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
        <circle cx={lastX} cy={yScale(lastPrice)} r="4" fill="hsl(var(--primary))" />
        {/* Price tag */}
        <rect x={padLeft + chartW + 4} y={lastY - 10} width={padRight - 10} height={20} rx="4" fill={priceLineColor} />
        <text x={padLeft + chartW + padRight / 2} y={lastY + 4} fill="white" fontSize="10" fontFamily="Inter, sans-serif" textAnchor="middle" fontWeight="600">{fmtPrice(lastPrice)}</text>
      </svg>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {renderGrid()}
      {candles.map((c, i) => {
        const x = padLeft + i * (chartW / candles.length) + (chartW / candles.length) / 2;
        const bullish = c.c >= c.o;
        const color = bullish ? "hsl(var(--success))" : "hsl(var(--destructive))";
        const bodyTop = yScale(Math.max(c.o, c.c));
        const bodyBot = yScale(Math.min(c.o, c.c));
        return (
          <g key={i}>
            <line x1={x} y1={yScale(c.h)} x2={x} y2={yScale(c.l)} stroke={color} strokeWidth="1" />
            <rect x={x - candleW / 2} y={bodyTop} width={candleW} height={Math.max(1, bodyBot - bodyTop)}
              fill={color} rx="0.5" />
          </g>
        );
      })}
      {/* Current price dashed line + tag */}
      <line x1={padLeft} y1={lastY} x2={padLeft + chartW} y2={lastY} stroke={priceLineColor} strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />
      <rect x={padLeft + chartW + 4} y={lastY - 10} width={padRight - 10} height={20} rx="4" fill={priceLineColor} />
      <text x={padLeft + chartW + padRight / 2} y={lastY + 4} fill="white" fontSize="10" fontFamily="Inter, sans-serif" textAnchor="middle" fontWeight="600">{fmtPrice(lastPrice)}</text>
    </svg>
  );
}

// ─── AI Chat stream helper ───
const AI_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-trading`;

async function streamAI(
  messages: ChatMsg[],
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  const resp = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "AI service error" }));
    throw new Error(err.error || "AI service error");
  }

  if (!resp.body) throw new Error("No stream body");
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* partial */ }
    }
  }
  onDone();
}

// ─── Fetch real prices helper ───
const PRICES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-prices`;

async function fetchLivePrices(symbols: string[]): Promise<Record<string, number>> {
  try {
    const resp = await fetch(PRICES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ symbols }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.prices ?? {};
    }
  } catch (e) {
    console.error("Price fetch error:", e);
  }
  return {};
}

// ─── Main component ───
const Trading = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<Trade[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("crypto");
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [candles, setCandles] = useState<ReturnType<typeof generateCandles>>([]);
  const [livePrice, setLivePrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [orderSize, setOrderSize] = useState("");
  const [leverage, setLeverage] = useState(1);
  const [orderType, setOrderType] = useState("market");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [slMode, setSlMode] = useState<"price" | "pct">("price");
  const [tpMode, setTpMode] = useState<"price" | "pct">("price");
  const [placing, setPlacing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showAssetList, setShowAssetList] = useState(false);
  const [balance, setBalance] = useState(0);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [realApiPrices, setRealApiPrices] = useState<Record<string, number>>({});
  const openTradeSnapshots = useMemo(() => Object.fromEntries(openTrades.map((trade) => {
    const symbol = trade.assets?.symbol ?? "";
    const snapshotPrice = trade.current_price ? Number(trade.current_price) : (livePrices[symbol] || undefined);
    const displayPrice = trade.current_price ? Number(trade.current_price) : (livePrices[symbol] || Number(trade.entry_price));
    const displayPnl = computeLivePnl(trade, snapshotPrice);

    return [trade.id, { displayPrice, displayPnl }];
  })), [openTrades, livePrices]);

  // Trading mode: "manual" or "ai"
  const [tradingMode, setTradingMode] = useState<"manual" | "ai">("manual");

  // AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch live prices periodically
  const refreshPrices = useCallback(async (assetList: Asset[]) => {
    if (!assetList.length) return;
    const symbols = assetList.map(a => a.symbol);
    const prices = await fetchLivePrices(symbols);
    if (Object.keys(prices).length > 0) {
      setRealApiPrices(prices);
      setLivePrices(prices);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data: a }, { data: openT }, { data: closedT }, { data: wallet }] = await Promise.all([
      supabase.from("assets").select("*").eq("enabled", true).order("symbol"),
      supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", user.id).eq("status", "open").order("opened_at", { ascending: false }),
      supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", user.id).eq("status", "closed").order("closed_at", { ascending: false }).limit(20),
      supabase.from("wallets").select("balance").eq("user_id", user.id).eq("currency", "EUR").maybeSingle(),
    ]);
    const assetList = (a ?? []) as Asset[];
    setAssets(assetList);
    setOpenTrades((openT ?? []) as Trade[]);
    setClosedTrades((closedT ?? []) as Trade[]);
    setBalance(Number(wallet?.balance ?? 0));
    setLoading(false);

    // Fetch real prices
    refreshPrices(assetList);

    if (!selectedAsset && assetList.length > 0) {
      const btcAsset = assetList.find(a => a.symbol.toUpperCase().includes("BTC") && a.type === "crypto");
      selectAsset(btcAsset ?? assetList[0], {});
    }
  }, [user, selectedAsset]);

  useEffect(() => { fetchData(); }, [user]);

  // Realtime subscription for instant trade updates (admin manipulation)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('client-trades-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trades',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const updated = payload.new as any;
          if (updated.status === 'open') {
            // Update the specific trade in-place for instant P&L refresh
            setOpenTrades(prev => prev.map(t => 
              t.id === updated.id 
                ? { ...t, ...updated, assets: t.assets } 
                : t
            ));
          } else if (updated.status === 'closed') {
            // Trade was closed (possibly by admin manipulation finishing)
            // Move from open to closed
            setOpenTrades(prev => prev.filter(t => t.id !== updated.id));
            // Re-fetch closed trades and balance
            const [{ data: closedT }, { data: wallet }] = await Promise.all([
              supabase.from("trades").select("*, assets(symbol, name)")
                .eq("user_id", user.id).eq("status", "closed")
                .order("closed_at", { ascending: false }).limit(20),
              supabase.from("wallets").select("balance")
                .eq("user_id", user.id).eq("currency", "EUR").maybeSingle(),
            ]);
            if (closedT) setClosedTrades(closedT as Trade[]);
            if (wallet) setBalance(Number(wallet.balance));
          }
        }
      )
      .subscribe();

    // Also poll every 15s as a fallback
    const interval = setInterval(async () => {
      const { data: openT } = await supabase
        .from("trades").select("*, assets(symbol, name)")
        .eq("user_id", user.id).eq("status", "open")
        .order("opened_at", { ascending: false });
      if (openT) setOpenTrades(openT as Trade[]);
      const { data: wallet } = await supabase
        .from("wallets").select("balance")
        .eq("user_id", user.id).eq("currency", "EUR").maybeSingle();
      if (wallet) setBalance(Number(wallet.balance));
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  // Refresh prices every 30 seconds
  useEffect(() => {
    if (!assets.length) return;
    const interval = setInterval(() => refreshPrices(assets), 10000);
    return () => clearInterval(interval);
  }, [assets, refreshPrices]);

  // Update live price when livePrices map changes and we have a selected asset
  // Only generate chart on first load; afterwards just update the last candle
  const chartInitialized = useRef(false);
  useEffect(() => {
    if (!selectedAsset || !livePrices[selectedAsset.symbol]) return;
    const realPrice = livePrices[selectedAsset.symbol];
    setLivePrice(realPrice);

    if (!chartInitialized.current || candles.length === 0) {
      // First time: generate full chart ending at the real price
      const tf = TIMEFRAME_CONFIG[timeframe];
      const data = generateCandles(tf.count, realPrice, tf.intervalMs);
      setCandles(data);
      setPriceChange(+((data[data.length - 1].c - data[0].o) / data[0].o * 100).toFixed(2));
      chartInitialized.current = true;
    } else {
      // Subsequent updates: smoothly update last candle to real price
      setCandles(prev => {
        if (!prev.length) return prev;
        const last = { ...prev[prev.length - 1] };
        last.c = realPrice;
        last.h = Math.max(last.h, realPrice);
        last.l = Math.min(last.l, realPrice);
        return [...prev.slice(0, -1), last];
      });
    }
  }, [livePrices, selectedAsset?.symbol]);

  // Simulate real-time ticks (every 1.2s)
  useEffect(() => {
    if (!selectedAsset || !candles.length) return;
    const tickInterval = setInterval(() => {
      setCandles(prev => {
        if (!prev.length) return prev;
        const last = { ...prev[prev.length - 1] };
        // Very small micro-ticks to simulate live movement without drifting from real price
        const volatility = last.c < 1 ? 0.0003 : last.c < 100 ? 0.00015 : 0.00008;
        // Mean-revert toward real API price to prevent drift
        const realPrice = realApiPrices[selectedAsset?.symbol ?? ""];
        let drift = 0;
        if (realPrice && realPrice > 0) {
          const deviation = (last.c - realPrice) / realPrice;
          drift = -deviation * 0.05; // gentle pull back toward real price
        }
        const tick = ((Math.random() - 0.5) * last.c * volatility) + (last.c * drift);
        last.c = +(last.c + tick).toFixed(last.c < 1 ? 6 : 2);
        last.h = Math.max(last.h, last.c);
        last.l = Math.min(last.l, last.c);
        setLivePrice(last.c);
        setPriceChange(+((last.c - prev[0].o) / prev[0].o * 100).toFixed(2));
        // Update livePrices map so open position P&L refreshes on every tick
        if (selectedAsset) {
          setLivePrices(lp => ({ ...lp, [selectedAsset.symbol]: last.c }));
        }
        return [...prev.slice(0, -1), last];
      });
    }, 1200);

    // Shift candles (create new candle) at the timeframe interval, capped to every 10s for fast timeframes
    const tf = TIMEFRAME_CONFIG[timeframe];
    const shiftMs = Math.max(10_000, Math.min(tf.intervalMs, 60_000));
    const shiftInterval = setInterval(() => {
      setCandles(prev => {
        if (!prev.length) return prev;
        const lastClose = prev[prev.length - 1].c;
        const newCandle = {
          time: new Date().toISOString(),
          o: lastClose, h: lastClose, l: lastClose, c: lastClose,
        };
        return [...prev.slice(1), newCandle];
      });
    }, shiftMs);

    return () => { clearInterval(tickInterval); clearInterval(shiftInterval); };
  }, [selectedAsset?.id, timeframe, candles.length > 0]);

  // Simulate micro-ticks for all open-trade assets so P&L feels live
  useEffect(() => {
    if (!openTrades.length) return;
    const interval = setInterval(() => {
      setLivePrices(prev => {
        const next = { ...prev };
        for (const t of openTrades) {
          const sym = t.assets?.symbol;
          if (!sym || sym === selectedAsset?.symbol) continue;
          const cur = next[sym];
          if (!cur) continue;
          const volatility = cur < 1 ? 0.0003 : cur < 100 ? 0.00015 : 0.00008;
          // Mean-revert toward real API price
          const realPrice = realApiPrices[sym];
          let drift = 0;
          if (realPrice && realPrice > 0) {
            const deviation = (cur - realPrice) / realPrice;
            drift = -deviation * 0.05;
          }
          const tick = ((Math.random() - 0.5) * cur * volatility) + (cur * drift);
          next[sym] = +(cur + tick).toFixed(cur < 1 ? 6 : 2);
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [openTrades, selectedAsset?.symbol, realApiPrices]);

  const selectAsset = (asset: Asset, pricesMap?: Record<string, number>) => {
    chartInitialized.current = false; // Reset so chart regenerates for new asset
    setSelectedAsset(asset);
    setShowAssetList(false);
    const prices = pricesMap ?? livePrices;
    const fallbackPrices: Record<string, number> = {
      BTC: 62500, ETH: 3400, SOL: 145, XRP: 0.52, BNB: 580,
      DOGE: 0.12, ADA: 0.45, DOT: 7.2, LINK: 14.5, AVAX: 35,
      AAPL: 178.50, TSLA: 248.30, MSFT: 415.80, AMZN: 185.60,
      GOOGL: 153.40, NVDA: 875.30, META: 505.20,
      "EUR/USD": 1.0875, "GBP/USD": 1.2680, "USD/JPY": 149.35,
    };
    const realPrice = prices[asset.symbol];
    const sym = asset.symbol.replace(/\/.*$/, "");
    const base = realPrice || fallbackPrices[sym] || fallbackPrices[asset.symbol] || (100 + Math.random() * 200);
    const tf = TIMEFRAME_CONFIG[timeframe];
    const data = generateCandles(tf.count, base, tf.intervalMs);
    setCandles(data);
    setLivePrice(base);
    setPriceChange(+((data[data.length - 1].c - data[0].o) / data[0].o * 100).toFixed(2));
    setOrderSize(""); setLeverage(1); setStopLoss(""); setTakeProfit(""); setSlMode("price"); setTpMode("price");
    chartInitialized.current = true;
  };

  const placeTrade = async () => {
    if (!user || !selectedAsset || !orderSize) return;
    if (!isMarketOpen(selectedAsset)) {
      toast.error(`${selectedAsset.symbol} market is currently closed. Only crypto trading is available.`);
      return;
    }
    const sizeNum = Number(orderSize);
    if (isNaN(sizeNum) || sizeNum <= 0) { toast.error("Enter a valid amount"); return; }
    if (sizeNum > balance) { toast.error("Insufficient balance"); return; }
    setPlacing(true);
    const { data: wallet } = await supabase
      .from("wallets").select("id, balance").eq("user_id", user.id).eq("currency", "EUR").maybeSingle();
    if (!wallet || Number(wallet.balance) < sizeNum) {
      toast.error("Insufficient balance"); setPlacing(false); return;
    }
    await supabase.from("wallets").update({ balance: Number(wallet.balance) - sizeNum }).eq("id", wallet.id);
    const { error } = await supabase.from("trades").insert({
      user_id: user.id, asset_id: selectedAsset.id, direction, size: sizeNum,
      entry_price: livePrice, leverage, order_type: orderType,
      stop_loss: stopLoss ? (slMode === "pct" ? +(livePrice * (1 - Number(stopLoss) / 100)).toFixed(2) : Number(stopLoss)) : null,
      take_profit: takeProfit ? (tpMode === "pct" ? +(livePrice * (1 + Number(takeProfit) / 100)).toFixed(2) : Number(takeProfit)) : null,
    });
    if (error) toast.error("Failed to place order");
    else {
      toast.success(`${direction.toUpperCase()} ${selectedAsset.symbol} — €${sizeNum.toLocaleString()} at ${leverage}×`);
      setOrderSize(""); setStopLoss(""); setTakeProfit(""); fetchData();
    }
    setPlacing(false);
  };

  const closeTrade = async (trade: Trade) => {
    // If admin has set a target P&L on the open trade (pnl != 0 for open trades = admin override),
    // use that value instead of the displayed snapshot to preserve admin intent
    const adminTargetPnl = trade.pnl && Number(trade.pnl) !== 0 ? Number(trade.pnl) : null;
    
    const snapshot = openTradeSnapshots[trade.id];
    const finalPrice = snapshot?.displayPrice ?? (trade.current_price ? Number(trade.current_price) : Number(trade.entry_price));
    const finalPnl = adminTargetPnl !== null 
      ? Number(adminTargetPnl.toFixed(2))
      : Number((snapshot?.displayPnl ?? 0).toFixed(2));

    await supabase.from("trades").update({
      status: "closed",
      closed_at: new Date().toISOString(),
      pnl: finalPnl,
      current_price: finalPrice,
    }).eq("id", trade.id);

    const { data: wallet } = await supabase.from("wallets").select("id, balance").eq("user_id", user!.id).eq("currency", "EUR").maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + Number(trade.size) + finalPnl }).eq("id", wallet.id);
    }

    toast.success(`Trade closed — P&L: €${finalPnl.toFixed(2)}`);
    fetchData();
  };

  const sendAIMessage = async () => {
    if (!chatInput.trim() || aiLoading) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput.trim() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setAiLoading(true);

    let assistantContent = "";
    const upsert = (chunk: string) => {
      assistantContent += chunk;
      setChatMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamAI(updatedMessages, upsert, () => setAiLoading(false));
    } catch (e: any) {
      toast.error(e.message || "AI error");
      setAiLoading(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const selectedMarketOpen = selectedAsset ? isMarketOpen(selectedAsset) : true;
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

  const selectedIcon = selectedAsset ? getAssetIcon(selectedAsset.symbol, selectedAsset.icon_url) : null;

  return (
    <div className="space-y-4">
      {/* ─── TOP: chart + order panel ─── */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
        {/* Chart area */}
        <div className="flex-1 flex flex-col space-y-3">
          {/* Asset header */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                {/* Asset selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowAssetList(!showAssetList)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/70 transition-colors"
                  >
                    {selectedIcon ? (
                      <img src={selectedIcon} alt={selectedAsset?.symbol} className="h-8 w-8 rounded-full object-contain" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {selectedAsset?.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="font-display font-bold text-base leading-tight">{selectedAsset?.symbol}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{selectedAsset?.name}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
                  </button>

                  {/* Dropdown */}
                  {showAssetList && (
                    <Card className="absolute top-full left-0 mt-2 z-50 w-[calc(100vw-3rem)] sm:w-80 max-h-[420px] overflow-hidden shadow-2xl border">
                      <CardContent className="p-3 space-y-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-10" />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {["all", "crypto", "stock", "forex"].map(t => (
                            <button key={t} onClick={() => setTypeFilter(t)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                            >{t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
                          ))}
                        </div>
                        <div className="space-y-0.5 max-h-72 overflow-y-auto">
                          {filteredAssets.map(a => {
                            const icon = getAssetIcon(a.symbol, a.icon_url);
                            return (
                              <button key={a.id} onClick={() => selectAsset(a)}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left hover:bg-muted transition-colors ${selectedAsset?.id === a.id ? "bg-primary/5 border border-primary/20" : ""}`}
                              >
                                {icon ? (
                                  <img src={icon} alt={a.symbol} className="h-8 w-8 rounded-full object-contain" />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{a.symbol.slice(0, 3)}</div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-sm">{a.symbol}</p>
                                    {!isMarketOpen(a) && (
                                      <span className="text-[9px] px-1 py-0.5 rounded bg-destructive/10 text-destructive font-medium">Closed</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">{a.name}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  {livePrices[a.symbol] ? (
                                    <p className="text-sm font-semibold">€{livePrices[a.symbol].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: livePrices[a.symbol] < 1 ? 4 : 2 })}</p>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] capitalize">{a.type}</Badge>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Price display */}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-display font-bold leading-tight">
                      €{livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: livePrice < 1 ? 6 : livePrice < 100 ? 4 : 2 })}
                    </p>
                    {!selectedMarketOpen && (
                      <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                        <Clock className="h-3 w-3 mr-0.5" /> Closed
                      </Badge>
                    )}
                  </div>
                  <span className={`text-sm font-semibold flex items-center gap-0.5 ${priceChange >= 0 ? "text-success" : "text-destructive"}`}>
                    {priceChange >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {priceChange >= 0 ? "+" : ""}{priceChange}%
                  </span>
                </div>
              </div>

              {/* Chart type + Timeframe toggles */}
              <div className="flex items-center gap-2 overflow-x-auto">
                <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1 shrink-0">
                  {(Object.keys(TIMEFRAME_CONFIG) as Timeframe[]).map(tf => (
                    <Button key={tf} size="sm" variant={timeframe === tf ? "default" : "ghost"}
                      onClick={() => {
                        setTimeframe(tf);
                        if (livePrice > 0) {
                          const cfg = TIMEFRAME_CONFIG[tf];
                          const data = generateCandles(cfg.count, livePrice, cfg.intervalMs);
                          setCandles(data);
                          setPriceChange(+((data[data.length - 1].c - data[0].o) / data[0].o * 100).toFixed(2));
                        }
                      }}
                      className="h-8 px-2.5 text-xs font-semibold"
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button size="sm" variant={chartType === "candle" ? "default" : "ghost"}
                    onClick={() => setChartType("candle")} className="h-8 w-8 p-0">
                    <CandlestickChart className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant={chartType === "line" ? "default" : "ghost"}
                    onClick={() => setChartType("line")} className="h-8 w-8 p-0">
                    <LineChartIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
             <CardContent className="p-2 md:p-3">
              <div className="h-[340px] md:h-[400px]">
                <PriceChart candles={candles} chartType={chartType} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT PANEL: Manual / AI toggle ─── */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col space-y-3">
          {/* Mode switcher */}
          <div className="grid grid-cols-2 gap-0 bg-muted rounded-xl p-1">
            <button
              onClick={() => setTradingMode("manual")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tradingMode === "manual"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="h-4 w-4" /> Manual Trade
            </button>
            <button
              onClick={() => setTradingMode("ai")}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                tradingMode === "ai"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="h-4 w-4" /> AI Assistant
            </button>
          </div>

          {tradingMode === "manual" ? (
            /* ─── MANUAL ORDER FORM ─── */
            <Card className="flex-1 flex flex-col overflow-y-auto">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display">Place Order</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Available: <span className="font-semibold text-foreground">€{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Market closed warning */}
                {!selectedMarketOpen && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>{selectedAsset?.symbol} market is closed. Switch to a crypto asset to trade now.</span>
                  </div>
                )}
                {/* Direction */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={direction === "buy" ? "default" : "outline"} onClick={() => setDirection("buy")}
                    className={`h-11 text-base font-bold ${direction === "buy" ? "bg-success hover:bg-success/90 text-success-foreground" : ""}`}>
                    <ArrowUpRight className="h-5 w-5 mr-1.5" /> Buy
                  </Button>
                  <Button variant={direction === "sell" ? "destructive" : "outline"} onClick={() => setDirection("sell")}
                    className="h-11 text-base font-bold">
                    <ArrowDownRight className="h-5 w-5 mr-1.5" /> Sell
                  </Button>
                </div>

                {/* Order type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Order Type</Label>
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market Order</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                      <SelectItem value="stop">Stop Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Amount (€)</Label>
                  <Input type="number" value={orderSize} onChange={e => setOrderSize(e.target.value)}
                    placeholder="Enter amount" className="h-10 text-base" />
                  {Number(orderSize) > 0 && livePrice > 0 && (
                    <p className="text-xs text-muted-foreground">
                      ≈ {(Number(orderSize) / livePrice).toFixed(livePrice > 100 ? 6 : 4)} {selectedAsset?.symbol ?? ""}
                    </p>
                  )}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[25, 50, 75, 100].map(pct => (
                      <button key={pct} onClick={() => setOrderSize(String(Math.floor(balance * pct / 100)))}
                        className="text-xs font-semibold py-1.5 rounded-lg bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
                      >{pct}%</button>
                    ))}
                  </div>
                </div>

                {/* Leverage */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Leverage</Label>
                    <Badge variant="outline" className="text-xs font-bold">{leverage}×</Badge>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {leverageSteps.map(l => (
                      <button key={l} onClick={() => setLeverage(l)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${leverage === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                      >{l}×</button>
                    ))}
                  </div>
                </div>

                {/* SL / TP */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-destructive font-medium">Stop Loss</Label>
                      <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
                        <button onClick={() => { setSlMode("price"); setStopLoss(""); }} className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-colors ${slMode === "price" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>€</button>
                        <button onClick={() => { setSlMode("pct"); setStopLoss(""); }} className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-colors ${slMode === "pct" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>%</button>
                      </div>
                    </div>
                    <Input type="number" value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder={slMode === "pct" ? "e.g. 5" : "Optional"} className="h-10" />
                    {slMode === "pct" && stopLoss && livePrice > 0 && (
                      <p className="text-[10px] text-muted-foreground">= €{(livePrice * (1 - Number(stopLoss) / 100)).toFixed(2)}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-success font-medium">Take Profit</Label>
                      <div className="flex gap-0.5 bg-muted rounded-md p-0.5">
                        <button onClick={() => { setTpMode("price"); setTakeProfit(""); }} className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-colors ${tpMode === "price" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>€</button>
                        <button onClick={() => { setTpMode("pct"); setTakeProfit(""); }} className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition-colors ${tpMode === "pct" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>%</button>
                      </div>
                    </div>
                    <Input type="number" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder={tpMode === "pct" ? "e.g. 10" : "Optional"} className="h-10" />
                    {tpMode === "pct" && takeProfit && livePrice > 0 && (
                      <p className="text-[10px] text-muted-foreground">= €{(livePrice * (1 + Number(takeProfit) / 100)).toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {exposure > 0 && (
                  <div className="bg-muted/60 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Margin</span>
                      <span className="font-semibold">€{Number(orderSize).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Exposure</span>
                      <span className="font-semibold">€{exposure.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Entry Price</span>
                      <span className="font-semibold">€{livePrice.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                 <Button
                  className={`w-full h-12 text-base font-bold rounded-xl ${direction === "buy" ? "bg-success hover:bg-success/90 text-success-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}`}
                  onClick={() => setConfirmOpen(true)} disabled={placing || !orderSize || !selectedMarketOpen}
                >
                  {!selectedMarketOpen ? "Market Closed" : placing ? "Placing Order..." : `${direction === "buy" ? "Buy" : "Sell"} ${selectedAsset?.symbol ?? ""}`}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* ─── AI ASSISTANT PANEL ─── */
            <Card className="flex flex-col" style={{ height: "calc(100%  - 52px)" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" /> PlanB AI Assistant
                </CardTitle>
                <p className="text-xs text-muted-foreground">Ask for trade signals, analysis, or market insights</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-3 pt-0 min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-[280px] max-h-[420px]">
                  {chatMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                      <Bot className="h-10 w-10 mb-3 opacity-30" />
                      <p className="text-sm font-medium">AI Trading Assistant</p>
                      <p className="text-xs mt-1 max-w-[220px]">Ask me to analyze any asset, suggest trades, or explain market trends</p>
                      <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                        {["Analyze BTC", "Best crypto to buy?", "Market outlook"].map(q => (
                          <button key={q} onClick={() => { setChatInput(q); }}
                            className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium hover:bg-muted/70 transition-colors"
                          >{q}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {aiLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendAIMessage()}
                    placeholder="Ask AI for trading advice..."
                    className="h-10 flex-1"
                    disabled={aiLoading}
                  />
                  <Button size="icon" onClick={sendAIMessage} disabled={aiLoading || !chatInput.trim()} className="h-10 w-10 shrink-0">
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── OPEN POSITIONS ─── */}
      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          Open Positions {openTrades.length > 0 && <Badge variant="secondary" className="text-[10px] px-1.5">{openTrades.length}</Badge>}
        </h3>
        <Card>
          <CardContent className="p-0">
            {openTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Clock className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-base font-medium">No open positions</p>
                <p className="text-sm mt-1">Select an asset and place your first trade</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {["Asset", "Direction", "Size", "Entry", "Current", "Leverage", "P&L", ""].map(h => (
                        <th key={h} className={`p-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {openTrades.map(t => {
                      const symbol = t.assets?.symbol;
                      // Use admin-set current_price if available (manipulation), otherwise live market price
                      const priceForPnl = t.current_price ? Number(t.current_price) : (livePrices[symbol ?? ""] || undefined);
                      const pnl = computeLivePnl(t, priceForPnl);
                      const displayPrice = t.current_price ? Number(t.current_price) : (livePrices[symbol ?? ""] || Number(t.entry_price));
                      const tradeIcon = t.assets ? getAssetIcon(t.assets.symbol, null) : null;
                      return (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              {tradeIcon ? (
                                <img src={tradeIcon} alt="" className="h-6 w-6 rounded-full object-contain" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold">
                                  {t.assets?.symbol?.slice(0, 2)}
                                </div>
                              )}
                              <span className="font-semibold">{t.assets?.symbol}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <Badge className={`capitalize text-xs ${t.direction === "buy" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                              {t.direction === "buy" ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                              {t.direction}
                            </Badge>
                          </td>
                          <td className="p-3.5 font-medium">€{Number(t.size).toLocaleString()}</td>
                          <td className="p-3.5 text-muted-foreground">€{Number(t.entry_price).toFixed(2)}</td>
                          <td className="p-3.5">€{displayPrice.toFixed(2)}</td>
                          <td className="p-3.5">{t.leverage}×</td>
                          <td className={`p-3.5 font-bold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                            {pnl >= 0 ? "+" : ""}€{pnl.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-right">
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 text-xs h-8 px-3"
                              onClick={() => closeTrade(t)}>
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
      </div>

      {/* ─── TRADE HISTORY ─── */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Trade History</h3>
        <Card>
          <CardContent className="p-0">
            {closedTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-base font-medium">No trade history yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {["Asset", "Direction", "Size", "Entry", "Leverage", "P&L", "Closed"].map(h => (
                        <th key={h} className="p-3.5 font-medium text-muted-foreground text-xs uppercase tracking-wider text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {closedTrades.map(t => {
                      const pnl = Number(t.pnl ?? 0);
                      const tradeIcon = t.assets ? getAssetIcon(t.assets.symbol, null) : null;
                      return (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              {tradeIcon ? (
                                <img src={tradeIcon} alt="" className="h-6 w-6 rounded-full object-contain" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold">
                                  {t.assets?.symbol?.slice(0, 2)}
                                </div>
                              )}
                              <span className="font-semibold">{t.assets?.symbol}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <Badge className={`capitalize text-xs ${t.direction === "buy" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                              {t.direction}
                            </Badge>
                          </td>
                          <td className="p-3.5 font-medium">€{Number(t.size).toLocaleString()}</td>
                          <td className="p-3.5 text-muted-foreground">€{Number(t.entry_price).toFixed(2)}</td>
                          <td className="p-3.5">{t.leverage}×</td>
                          <td className={`p-3.5 font-bold ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                            {pnl >= 0 ? "+" : ""}€{pnl.toFixed(2)}
                          </td>
                          <td className="p-3.5 text-muted-foreground text-xs">
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
      </div>

      {/* Trade Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {leverage > 1 && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              Confirm {direction === "buy" ? "Buy" : "Sell"} Order
            </DialogTitle>
            {leverage > 1 && (
              <DialogDescription className="text-yellow-600 bg-yellow-500/10 p-3 rounded-lg text-xs">
                ⚠️ <strong>Risk Warning:</strong> You are trading with {leverage}× leverage. Leveraged positions amplify both gains and losses. You may lose more than your initial investment. Only trade with funds you can afford to lose.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Asset</span><span className="font-medium">{selectedAsset?.symbol}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Direction</span><span className={`font-medium ${direction === "buy" ? "text-success" : "text-destructive"}`}>{direction.toUpperCase()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span className="font-medium">€{Number(orderSize).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Entry Price</span><span className="font-medium">{livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Leverage</span><span className="font-medium">{leverage}×</span></div>
            {stopLoss && <div className="flex justify-between"><span className="text-muted-foreground">Stop Loss</span><span className="font-medium">{slMode === "pct" ? `${stopLoss}%` : stopLoss}</span></div>}
            {takeProfit && <div className="flex justify-between"><span className="text-muted-foreground">Take Profit</span><span className="font-medium">{tpMode === "pct" ? `${takeProfit}%` : takeProfit}</span></div>}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Effective Exposure</span>
              <span>€{(Number(orderSize) * leverage).toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              className={direction === "buy" ? "bg-success hover:bg-success/90 text-success-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"}
              onClick={() => { setConfirmOpen(false); placeTrade(); }}
              disabled={placing}
            >
              {placing ? "Placing..." : `Confirm ${direction === "buy" ? "Buy" : "Sell"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trading;
