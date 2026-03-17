import { useEffect, useState } from "react";
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
  { symbol: "EUR/USD", name: "Euro / Dollar", price: 1.0842, change24h: -0.12, icon: "€", type: "forex" },
  { symbol: "GBP/USD", name: "Pound / Dollar", price: 1.2654, change24h: 0.08, icon: "£", type: "forex" },
  { symbol: "USD/JPY", name: "Dollar / Yen", price: 154.32, change24h: 0.34, icon: "¥", type: "forex" },
  { symbol: "AUD/USD", name: "Aussie / Dollar", price: 0.6523, change24h: -0.21, icon: "A$", type: "forex" },
];

const formatPrice = (price: number) => {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
};

const MarketOverview = () => {
  const [filter, setFilter] = useState<"all" | "crypto" | "stock" | "forex">("all");

  const filtered = filter === "all" ? ASSETS : ASSETS.filter((a) => a.type === filter);

  const tabs = [
    { key: "all", label: "All Markets" },
    { key: "crypto", label: "Crypto" },
    { key: "stock", label: "Stocks" },
    { key: "forex", label: "Forex" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((asset) => (
          <Card
            key={asset.symbol}
            className="hover:shadow-md transition-all cursor-pointer group border hover:border-primary/30"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-lg">
                    {asset.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{asset.symbol}</p>
                    <p className="text-xs text-muted-foreground">{asset.name}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    asset.type === "crypto"
                      ? "bg-primary/10 text-primary"
                      : asset.type === "stock"
                      ? "bg-accent/20 text-accent-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {asset.type}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-lg font-display font-bold">
                  {formatPrice(asset.price)}
                </span>
                <span
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    asset.change24h >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {asset.change24h >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {asset.change24h >= 0 ? "+" : ""}
                  {asset.change24h.toFixed(2)}%
                </span>
              </div>
              {/* Mini sparkline placeholder */}
              <div className="mt-3 h-8 w-full rounded overflow-hidden bg-muted/50">
                <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                  <path
                    d={
                      asset.change24h >= 0
                        ? "M0,25 Q10,22 20,18 T40,15 T60,10 T80,8 T100,5"
                        : "M0,5 Q10,8 20,12 T40,15 T60,20 T80,22 T100,25"
                    }
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
    </div>
  );
};

export default MarketOverview;
