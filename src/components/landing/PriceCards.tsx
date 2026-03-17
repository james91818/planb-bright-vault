import { useEffect, useState } from "react";

interface CoinPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

const FALLBACK_PRICES: CoinPrice[] = [
  { symbol: "BTC", name: "Bitcoin", price: 73797, change24h: 0.15, icon: "₿" },
  { symbol: "ETH", name: "Ethereum", price: 2309.7, change24h: 1.02, icon: "Ξ" },
  { symbol: "SOL", name: "Solana", price: 93.68, change24h: -0.28, icon: "◎" },
  { symbol: "BNB", name: "BNB", price: 612.4, change24h: 0.87, icon: "🔶" },
  { symbol: "XRP", name: "Ripple", price: 0.6218, change24h: -1.12, icon: "✕" },
  { symbol: "ADA", name: "Cardano", price: 0.4521, change24h: 2.34, icon: "₳" },
  { symbol: "DOGE", name: "Dogecoin", price: 0.1234, change24h: -0.45, icon: "Ð" },
  { symbol: "AVAX", name: "Avalanche", price: 35.82, change24h: 1.67, icon: "🔺" },
  { symbol: "DOT", name: "Polkadot", price: 7.12, change24h: -0.93, icon: "●" },
  { symbol: "LINK", name: "Chainlink", price: 14.52, change24h: 0.74, icon: "⬡" },
];

const formatPrice = (price: number) => {
  if (price >= 10000) return price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (price >= 100) return price.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
};

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
        const ids = "bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,polkadot,matic-network";
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        if (!res.ok) return;
        const data = await res.json();
        const mapping: Record<string, number> = {
          bitcoin: 0, ethereum: 1, solana: 2, binancecoin: 3, ripple: 4,
          cardano: 5, dogecoin: 6, "avalanche-2": 7, polkadot: 8, "matic-network": 9,
        };
        setPrices((prev) => {
          const updated = [...prev];
          Object.entries(mapping).forEach(([key, idx]) => {
            if (data[key]) {
              updated[idx] = { ...updated[idx], price: data[key].usd, change24h: data[key].usd_24h_change ?? updated[idx].change24h };
            }
          });
          return updated;
        });
      } catch { /* keep fallback */ }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Duplicate for seamless loop
  const tickerItems = [...prices, ...prices];

  return (
    <div className="w-full overflow-hidden bg-card border-b">
      <div className="flex animate-ticker">
        {tickerItems.map((coin, i) => {
          const positive = coin.change24h >= 0;
          const sparkline = generateSparkline(positive);
          return (
            <div
              key={`${coin.symbol}-${i}`}
              className="flex items-center gap-3 px-5 py-3 border-r border-border/50 min-w-[200px] shrink-0"
            >
              <div className="shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{coin.icon}</span>
                  <span className="font-semibold text-sm">{coin.symbol}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm text-foreground font-medium">${formatPrice(coin.price)}</span>
                  <span className={`text-xs font-semibold ${positive ? "text-success" : "text-destructive"}`}>
                    {positive ? "+" : ""}{coin.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="w-20 h-7 shrink-0">
                <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
                  <polyline
                    points={sparkline}
                    fill="none"
                    stroke={positive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
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
