import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
  type: "crypto" | "stock" | "forex";
}

const ASSETS: MarketAsset[] = [
  { symbol: "BTC/USD", name: "Bitcoin", price: 67432.18, change24h: 2.34, icon: "₿", type: "crypto" },
  { symbol: "ETH/USD", name: "Ethereum", price: 3521.42, change24h: 1.87, icon: "Ξ", type: "crypto" },
  { symbol: "SOL/USD", name: "Solana", price: 148.65, change24h: -0.92, icon: "◎", type: "crypto" },
  { symbol: "BNB/USD", name: "BNB", price: 584.30, change24h: 0.45, icon: "⬡", type: "crypto" },
  { symbol: "AAPL", name: "Apple Inc.", price: 178.72, change24h: 0.65, icon: "🍎", type: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", price: 245.30, change24h: -1.42, icon: "⚡", type: "stock" },
  { symbol: "GOOGL", name: "Alphabet", price: 141.80, change24h: 1.12, icon: "🔍", type: "stock" },
  { symbol: "AMZN", name: "Amazon", price: 178.25, change24h: 0.89, icon: "📦", type: "stock" },
];

const formatPrice = (price: number) => {
  if (price >= 1000) return `€${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `€${price.toFixed(2)}`;
};

const MarketOverview = () => {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {ASSETS.map((asset) => (
        <Card key={asset.symbol} className="hover:shadow-md transition-all cursor-pointer group border hover:border-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-lg">{asset.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{asset.symbol}</p>
                  <p className="text-xs text-muted-foreground">{asset.name}</p>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-lg font-display font-bold">{formatPrice(asset.price)}</span>
              <span className={`flex items-center gap-1 text-sm font-semibold ${asset.change24h >= 0 ? "text-success" : "text-destructive"}`}>
                {asset.change24h >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {asset.change24h >= 0 ? "+" : ""}{asset.change24h.toFixed(2)}%
              </span>
            </div>
            <div className="mt-3 h-8 w-full rounded overflow-hidden bg-muted/50">
              <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                <path
                  d={asset.change24h >= 0
                    ? "M0,25 Q10,22 20,18 T40,15 T60,10 T80,8 T100,5"
                    : "M0,5 Q10,8 20,12 T40,15 T60,20 T80,22 T100,25"}
                  fill="none"
                  stroke={asset.change24h >= 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)"}
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MarketOverview;
