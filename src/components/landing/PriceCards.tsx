import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CoinPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

const FALLBACK_PRICES: CoinPrice[] = [
  { symbol: "EURUSD", name: "EUR/USD", price: 1.1529, change24h: 0.21, icon: "€" },
  { symbol: "BTCUSD", name: "Bitcoin", price: 74167, change24h: -0.95, icon: "₿" },
  { symbol: "ETHUSD", name: "Ethereum", price: 2327.4, change24h: -1.08, icon: "Ξ" },
  { symbol: "GOLD", name: "Gold", price: 4999.21, change24h: -0.15, icon: "🥇" },
  { symbol: "SOLUSD", name: "Solana", price: 148.65, change24h: 2.34, icon: "◎" },
];

const formatPrice = (price: number) => {
  if (price >= 10000) return price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (price >= 100) return price.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
};

// Generate a random sparkline path
const generateSparkline = (positive: boolean) => {
  const points: number[] = [];
  let y = 15;
  for (let i = 0; i < 20; i++) {
    y += (Math.random() - (positive ? 0.4 : 0.6)) * 4;
    y = Math.max(3, Math.min(27, y));
    points.push(y);
  }
  return points.map((p, i) => `${(i / 19) * 100},${p}`).join(" ");
};

const PriceCards = () => {
  const [prices, setPrices] = useState<CoinPrice[]>(FALLBACK_PRICES);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = "bitcoin,ethereum,solana";
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        if (!res.ok) return;
        const data = await res.json();
        setPrices((prev) => {
          const updated = [...prev];
          if (data.bitcoin) { updated[1] = { ...updated[1], price: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change ?? updated[1].change24h }; }
          if (data.ethereum) { updated[2] = { ...updated[2], price: data.ethereum.usd, change24h: data.ethereum.usd_24h_change ?? updated[2].change24h }; }
          if (data.solana) { updated[4] = { ...updated[4], price: data.solana.usd, change24h: data.solana.usd_24h_change ?? updated[4].change24h }; }
          return updated;
        });
      } catch { /* keep fallback */ }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-x-auto bg-card border-b">
      <div className="flex min-w-max">
        {prices.map((coin) => {
          const positive = coin.change24h >= 0;
          const sparkline = generateSparkline(positive);
          return (
            <div
              key={coin.symbol}
              className="flex items-center gap-3 px-6 py-4 border-r last:border-r-0 min-w-[220px]"
            >
              <div className="shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{coin.icon}</span>
                  <span className="font-semibold text-sm">{coin.symbol}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm text-foreground font-medium">{formatPrice(coin.price)}</span>
                  <span className="text-xs text-muted-foreground">USD</span>
                  <span className={`text-xs font-semibold ${positive ? "text-success" : "text-destructive"}`}>
                    {positive ? "+" : ""}{coin.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="w-24 h-8 shrink-0">
                <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                  <polyline
                    points={sparkline}
                    fill="none"
                    stroke={positive ? "hsl(160, 84%, 39%)" : "hsl(0, 72%, 51%)"}
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PriceCards;
