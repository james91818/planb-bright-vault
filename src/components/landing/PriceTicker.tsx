import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CoinPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

const FALLBACK_PRICES: CoinPrice[] = [
  { symbol: "BTC", name: "Bitcoin", price: 67432.18, change24h: 2.34, icon: "₿" },
  { symbol: "ETH", name: "Ethereum", price: 3521.42, change24h: 1.87, icon: "Ξ" },
  { symbol: "SOL", name: "Solana", price: 148.65, change24h: -0.92, icon: "◎" },
  { symbol: "BNB", name: "BNB", price: 584.30, change24h: 0.45, icon: "⬡" },
  { symbol: "XRP", name: "XRP", price: 0.5234, change24h: -1.23, icon: "✕" },
  { symbol: "ADA", name: "Cardano", price: 0.4521, change24h: 3.12, icon: "₳" },
  { symbol: "DOGE", name: "Dogecoin", price: 0.1245, change24h: 5.67, icon: "Ð" },
  { symbol: "AVAX", name: "Avalanche", price: 35.82, change24h: -2.14, icon: "▲" },
  { symbol: "DOT", name: "Polkadot", price: 6.89, change24h: 1.05, icon: "●" },
  { symbol: "LINK", name: "Chainlink", price: 14.23, change24h: 0.78, icon: "⬡" },
  { symbol: "MATIC", name: "Polygon", price: 0.7125, change24h: -0.56, icon: "⬠" },
  { symbol: "UNI", name: "Uniswap", price: 7.45, change24h: 2.89, icon: "🦄" },
];

const formatPrice = (price: number) => {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
};

const PriceTicker = () => {
  const [prices, setPrices] = useState<CoinPrice[]>(FALLBACK_PRICES);

  useEffect(() => {
    // Try to fetch real prices from CoinGecko (free, no API key)
    const fetchPrices = async () => {
      try {
        const ids = "bitcoin,ethereum,solana,binancecoin,ripple,cardano,dogecoin,avalanche-2,polkadot,chainlink,matic-network,uniswap";
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        if (!res.ok) return;
        const data = await res.json();

        const mapping: Record<string, { symbol: string; name: string; icon: string }> = {
          bitcoin: { symbol: "BTC", name: "Bitcoin", icon: "₿" },
          ethereum: { symbol: "ETH", name: "Ethereum", icon: "Ξ" },
          solana: { symbol: "SOL", name: "Solana", icon: "◎" },
          binancecoin: { symbol: "BNB", name: "BNB", icon: "⬡" },
          ripple: { symbol: "XRP", name: "XRP", icon: "✕" },
          cardano: { symbol: "ADA", name: "Cardano", icon: "₳" },
          dogecoin: { symbol: "DOGE", name: "Dogecoin", icon: "Ð" },
          "avalanche-2": { symbol: "AVAX", name: "Avalanche", icon: "▲" },
          polkadot: { symbol: "DOT", name: "Polkadot", icon: "●" },
          chainlink: { symbol: "LINK", name: "Chainlink", icon: "⬡" },
          "matic-network": { symbol: "MATIC", name: "Polygon", icon: "⬠" },
          uniswap: { symbol: "UNI", name: "Uniswap", icon: "🦄" },
        };

        const updated: CoinPrice[] = Object.entries(data).map(([key, val]: [string, any]) => ({
          ...mapping[key],
          price: val.usd,
          change24h: val.usd_24h_change ?? 0,
        }));

        if (updated.length > 0) setPrices(updated);
      } catch {
        // Keep fallback prices
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Duplicate for seamless loop
  const doubled = [...prices, ...prices];

  return (
    <div className="w-full overflow-hidden bg-sidebar py-3 border-b border-sidebar-border">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: { repeat: Infinity, repeatType: "loop", duration: 30, ease: "linear" },
        }}
      >
        {doubled.map((coin, i) => (
          <div key={`${coin.symbol}-${i}`} className="flex items-center gap-2.5 shrink-0">
            <span className="text-lg">{coin.icon}</span>
            <span className="font-semibold text-sidebar-primary-foreground text-sm">
              {coin.symbol}
            </span>
            <span className="text-sidebar-foreground text-sm font-medium">
              {formatPrice(coin.price)}
            </span>
            <span
              className={`flex items-center gap-0.5 text-xs font-semibold ${
                coin.change24h >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {coin.change24h >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {coin.change24h >= 0 ? "+" : ""}
              {coin.change24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default PriceTicker;
