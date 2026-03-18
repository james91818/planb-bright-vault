const PRICES_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-prices`;

export async function fetchLivePrices(symbols: string[]): Promise<Record<string, number>> {
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

/**
 * Compute live P&L for a trade given the current market price.
 * Formula: ((currentPrice - entryPrice) / entryPrice) * size * leverage
 * For sell/short: invert the direction.
 */
export function computeLivePnl(
  trade: { entry_price: number; size: number; leverage: number; direction: string; pnl?: number | null; status: string },
  currentPrice: number | undefined
): number {
  // For closed trades, use the stored pnl
  if (trade.status === "closed") return Number(trade.pnl ?? 0);
  
  // If no live price available, return stored pnl
  if (!currentPrice) return Number(trade.pnl ?? 0);

  const entry = Number(trade.entry_price);
  const size = Number(trade.size);
  const leverage = Number(trade.leverage);
  
  if (entry === 0) return 0;

  const priceChange = (currentPrice - entry) / entry;
  const pnl = trade.direction === "buy"
    ? priceChange * size * leverage
    : -priceChange * size * leverage;

  return pnl;
}
