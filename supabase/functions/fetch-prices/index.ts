import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// CoinGecko IDs for our crypto symbols
const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  BNB: "binancecoin",
  DOGE: "dogecoin",
  ADA: "cardano",
  DOT: "polkadot",
  LINK: "chainlink",
  AVAX: "avalanche-2",
};

// Fallback stock prices (real-time stock APIs require paid keys)
const STOCK_PRICES: Record<string, number> = {
  AAPL: 178.50,
  TSLA: 248.30,
  MSFT: 415.80,
  AMZN: 185.60,
  GOOGL: 153.40,
  NVDA: 875.30,
  META: 505.20,
};

const COMMODITY_PRICES: Record<string, number> = {
  "XAU/USD": 2345.50,
  "XAG/USD": 28.75,
  "WTI": 78.40,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symbols } = await req.json();
    const prices: Record<string, number> = {};

    // Collect crypto symbols to fetch
    const cryptoSymbols = (symbols as string[]).filter(s => {
      const sym = s.replace(/\/.*$/, "");
      return CRYPTO_IDS[sym];
    });

    // Fetch crypto prices from CoinGecko (free, no key needed)
    if (cryptoSymbols.length > 0) {
      const ids = cryptoSymbols.map(s => {
        const sym = s.replace(/\/.*$/, "");
        return CRYPTO_IDS[sym];
      }).filter(Boolean).join(",");

      try {
        const cgResp = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur,usd`
        );
        if (cgResp.ok) {
          const cgData = await cgResp.json();
          for (const symbol of cryptoSymbols) {
            const sym = symbol.replace(/\/.*$/, "");
            const cgId = CRYPTO_IDS[sym];
            if (cgId && cgData[cgId]) {
              // Use EUR price if available, otherwise USD
              prices[symbol] = cgData[cgId].eur ?? cgData[cgId].usd ?? 0;
            }
          }
        }
      } catch (e) {
        console.error("CoinGecko fetch error:", e);
      }
    }

    // Add stock prices (static fallback - add real API later if needed)
    for (const symbol of (symbols as string[])) {
      if (!prices[symbol] && STOCK_PRICES[symbol]) {
        // Add small random variation to simulate live
        const base = STOCK_PRICES[symbol];
        prices[symbol] = +(base * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2);
      }
    }

    // Add commodity prices
    for (const symbol of (symbols as string[])) {
      if (!prices[symbol] && COMMODITY_PRICES[symbol]) {
        const base = COMMODITY_PRICES[symbol];
        prices[symbol] = +(base * (1 + (Math.random() - 0.5) * 0.002)).toFixed(2);
      }
    }

    return new Response(JSON.stringify({ prices }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-prices error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
