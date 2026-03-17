import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Search } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Trading = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [orderOpen, setOrderOpen] = useState<any>(null);
  const [order, setOrder] = useState({ direction: "buy", size: "", leverage: 1, order_type: "market", stop_loss: "", take_profit: "" });

  const fetchData = async () => {
    if (!user) return;
    const [{ data: a }, { data: t }] = await Promise.all([
      supabase.from("assets").select("*").eq("enabled", true).order("symbol"),
      supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", user.id).eq("status", "open"),
    ]);
    setAssets(a ?? []);
    setTrades(t ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const placeTrade = async () => {
    if (!user || !orderOpen || !order.size) return;
    const entryPrice = 1; // placeholder — real price comes from market data
    const sizeNum = Number(order.size);

    // Debit wallet
    const { data: wallet } = await supabase
      .from("wallets").select("id, balance").eq("user_id", user.id).eq("currency", "EUR").maybeSingle();
    if (!wallet || Number(wallet.balance) < sizeNum) {
      toast.error("Insufficient balance");
      return;
    }
    await supabase.from("wallets").update({ balance: Number(wallet.balance) - sizeNum }).eq("id", wallet.id);

    await supabase.from("trades").insert({
      user_id: user.id,
      asset_id: orderOpen.id,
      direction: order.direction,
      size: sizeNum,
      entry_price: entryPrice,
      leverage: order.leverage,
      order_type: order.order_type,
      stop_loss: order.stop_loss ? Number(order.stop_loss) : null,
      take_profit: order.take_profit ? Number(order.take_profit) : null,
    });

    toast.success(`${order.direction.toUpperCase()} order placed for ${orderOpen.symbol}`);
    setOrderOpen(null);
    setOrder({ direction: "buy", size: "", leverage: 1, order_type: "market", stop_loss: "", take_profit: "" });
    fetchData();
  };

  const closeTrade = async (trade: any) => {
    const pnl = Number(trade.pnl ?? 0);
    await supabase.from("trades").update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", trade.id);

    // Return size + pnl to wallet
    const { data: wallet } = await supabase
      .from("wallets").select("id, balance").eq("user_id", user!.id).eq("currency", "EUR").maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + Number(trade.size) + pnl }).eq("id", wallet.id);
    }
    toast.success("Trade closed");
    fetchData();
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Trading</h1>
        <p className="text-muted-foreground text-sm">Browse assets and place trades</p>
      </div>

      {/* Open Positions */}
      {trades.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Open Positions ({trades.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Asset</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Direction</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Size</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Entry</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Leverage</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">P&L</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-semibold">{(t as any).assets?.symbol}</td>
                      <td className="p-3">
                        <Badge variant={t.direction === "buy" ? "default" : "destructive"} className="capitalize text-xs">{t.direction}</Badge>
                      </td>
                      <td className="p-3">€{Number(t.size).toLocaleString()}</td>
                      <td className="p-3">€{Number(t.entry_price).toFixed(2)}</td>
                      <td className="p-3">{t.leverage}×</td>
                      <td className={`p-3 font-semibold ${Number(t.pnl) >= 0 ? "text-success" : "text-destructive"}`}>
                        {Number(t.pnl) >= 0 ? "+" : ""}€{Number(t.pnl ?? 0).toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="destructive" className="text-xs" onClick={() => closeTrade(t)}>Close</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Asset Browser */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
            <SelectItem value="stock">Stocks</SelectItem>
            <SelectItem value="forex">Forex</SelectItem>
            <SelectItem value="index">Indices</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-32">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-8">No assets found</div>
        ) : (
          filteredAssets.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              setOrderOpen(a);
              setOrder({ direction: "buy", size: "", leverage: 1, order_type: "market", stop_loss: "", take_profit: "" });
            }}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {a.icon_url ? (
                    <img src={a.icon_url} alt={a.symbol} className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {a.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{a.symbol}</p>
                    <p className="text-xs text-muted-foreground">{a.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="capitalize text-xs">{a.type}</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">Up to {a.leverage_max}×</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Order Dialog */}
      <Dialog open={!!orderOpen} onOpenChange={() => setOrderOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trade {orderOpen?.symbol}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={order.direction === "buy" ? "default" : "outline"}
                onClick={() => setOrder({ ...order, direction: "buy" })}
                className={order.direction === "buy" ? "bg-success hover:bg-success/90" : ""}
              >
                <TrendingUp className="h-4 w-4 mr-1" /> Buy
              </Button>
              <Button
                variant={order.direction === "sell" ? "destructive" : "outline"}
                onClick={() => setOrder({ ...order, direction: "sell" })}
              >
                <TrendingDown className="h-4 w-4 mr-1" /> Sell
              </Button>
            </div>
            <div className="space-y-1">
              <Label>Amount (€)</Label>
              <Input type="number" value={order.size} onChange={(e) => setOrder({ ...order, size: e.target.value })} placeholder="100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Leverage</Label>
                <Select value={String(order.leverage)} onValueChange={(v) => setOrder({ ...order, leverage: Number(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 5, 10, 25, 50, 100].filter(l => l <= (orderOpen?.leverage_max ?? 100)).map(l => (
                      <SelectItem key={l} value={String(l)}>{l}×</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Order Type</Label>
                <Select value={order.order_type} onValueChange={(v) => setOrder({ ...order, order_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                    <SelectItem value="stop">Stop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Stop Loss (optional)</Label>
                <Input type="number" value={order.stop_loss} onChange={(e) => setOrder({ ...order, stop_loss: e.target.value })} placeholder="—" />
              </div>
              <div className="space-y-1">
                <Label>Take Profit (optional)</Label>
                <Input type="number" value={order.take_profit} onChange={(e) => setOrder({ ...order, take_profit: e.target.value })} placeholder="—" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderOpen(null)}>Cancel</Button>
            <Button onClick={placeTrade} className={order.direction === "buy" ? "bg-success hover:bg-success/90" : ""}>
              {order.direction === "buy" ? "Buy" : "Sell"} {orderOpen?.symbol}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trading;
