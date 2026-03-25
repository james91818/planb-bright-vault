import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tools = [
  {
    type: "function",
    function: {
      name: "open_trade",
      description: "Open a new trade for the user. Use when user asks to buy/sell or open a position on an asset.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "The asset symbol, e.g. BTC/EUR, ETH/EUR, SOL/EUR" },
          direction: { type: "string", enum: ["buy", "sell"], description: "Trade direction" },
          size: { type: "number", description: "Trade size in EUR" },
          leverage: { type: "number", description: "Leverage multiplier, default 1" },
          stop_loss_pct: { type: "number", description: "Optional stop loss as % below entry (e.g. 5 means 5%)" },
          take_profit_pct: { type: "number", description: "Optional take profit as % above entry (e.g. 10 means 10%)" },
        },
        required: ["symbol", "direction", "size"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "close_trade",
      description: "Close an existing open trade by its trade ID. Use when user asks to close a position.",
      parameters: {
        type: "object",
        properties: {
          trade_id: { type: "string", description: "The UUID of the trade to close" },
        },
        required: ["trade_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_open_trades",
      description: "Get the user's currently open trades. Use when you need to see what positions they have before closing or advising.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executeTool(
  toolName: string,
  args: any,
  userId: string,
  supabase: any,
  tradingEnabled: boolean,
): Promise<string> {
  if (toolName === "get_open_trades") {
    const { data, error } = await supabase
      .from("trades")
      .select("id, direction, size, leverage, entry_price, pnl, opened_at, assets(symbol, name)")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("opened_at", { ascending: false });
    if (error) return JSON.stringify({ error: error.message });
    if (!data?.length) return JSON.stringify({ message: "No open trades found." });
    return JSON.stringify(data);
  }

  if (!tradingEnabled) {
    return JSON.stringify({ error: "Trading is not enabled. The user must enable 'Allow AI to trade' toggle first." });
  }

  if (toolName === "open_trade") {
    const { symbol, direction, size, leverage = 1, stop_loss_pct, take_profit_pct } = args;

    // Find asset
    const { data: asset } = await supabase
      .from("assets")
      .select("id, symbol, leverage_max")
      .eq("symbol", symbol)
      .eq("enabled", true)
      .maybeSingle();
    if (!asset) return JSON.stringify({ error: `Asset ${symbol} not found or disabled.` });

    const finalLeverage = Math.min(leverage, asset.leverage_max);

    // Check balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .eq("currency", "EUR")
      .maybeSingle();
    if (!wallet || Number(wallet.balance) < size) {
      return JSON.stringify({ error: `Insufficient balance. Available: €${wallet?.balance ?? 0}` });
    }

    // Get live price from price_cache
    const { data: priceRow } = await supabase
      .from("price_cache")
      .select("price")
      .eq("symbol", symbol)
      .maybeSingle();
    const entryPrice = priceRow?.price ?? 0;
    if (!entryPrice) return JSON.stringify({ error: `No price available for ${symbol}` });

    // Calculate SL/TP
    const sl = stop_loss_pct ? +(entryPrice * (1 - stop_loss_pct / 100)).toFixed(2) : null;
    const tp = take_profit_pct ? +(entryPrice * (1 + take_profit_pct / 100)).toFixed(2) : null;

    // Debit wallet
    await supabase.from("wallets").update({ balance: Number(wallet.balance) - size }).eq("id", wallet.id);

    // Insert trade
    const { data: trade, error } = await supabase.from("trades").insert({
      user_id: userId,
      asset_id: asset.id,
      direction,
      size,
      entry_price: entryPrice,
      leverage: finalLeverage,
      order_type: "market",
      stop_loss: sl,
      take_profit: tp,
    }).select("id, direction, size, leverage, entry_price").single();

    if (error) return JSON.stringify({ error: error.message });
    return JSON.stringify({
      success: true,
      message: `Opened ${direction.toUpperCase()} ${symbol} — €${size} at ${finalLeverage}× leverage. Entry: ${entryPrice}`,
      trade,
    });
  }

  if (toolName === "close_trade") {
    const { trade_id } = args;

    // Fetch the trade
    const { data: trade } = await supabase
      .from("trades")
      .select("*, assets(symbol)")
      .eq("id", trade_id)
      .eq("user_id", userId)
      .eq("status", "open")
      .maybeSingle();
    if (!trade) return JSON.stringify({ error: "Trade not found or already closed." });

    // Get current price
    const { data: priceRow } = await supabase
      .from("price_cache")
      .select("price")
      .eq("symbol", trade.assets?.symbol)
      .maybeSingle();
    const closePrice = priceRow?.price ?? Number(trade.entry_price);

    // Calculate P&L
    const entry = Number(trade.entry_price);
    const size = Number(trade.size);
    const leverage = Number(trade.leverage);
    const priceChange = (closePrice - entry) / entry;
    const pnl = trade.direction === "buy"
      ? +(priceChange * size * leverage).toFixed(2)
      : +(-priceChange * size * leverage).toFixed(2);

    // Close trade
    await supabase.from("trades").update({
      status: "closed",
      closed_at: new Date().toISOString(),
      pnl,
      current_price: closePrice,
    }).eq("id", trade_id);

    // Credit wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .eq("currency", "EUR")
      .maybeSingle();
    if (wallet) {
      await supabase.from("wallets").update({
        balance: Number(wallet.balance) + size + pnl,
      }).eq("id", wallet.id);
    }

    return JSON.stringify({
      success: true,
      message: `Closed ${trade.direction.toUpperCase()} ${trade.assets?.symbol} — P&L: €${pnl}`,
    });
  }

  return JSON.stringify({ error: "Unknown tool" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, trading_enabled, user_id } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const systemMessage = {
      role: "system",
      content: `You are PlanB AI Trading Assistant. You analyze markets and provide trading signals.

${trading_enabled ? `IMPORTANT: The user has enabled AI trading. You CAN execute trades on their behalf using the available tools.
- When user asks to buy/sell, use the open_trade tool directly.
- When user asks to close a position, first use get_open_trades to find the trade, then use close_trade.
- Always confirm what you did after executing a trade.
- If user says "buy BTC" without specifying amount, ask for the amount first.` : `The user has NOT enabled AI trading. You can only provide analysis and recommendations. If they ask you to trade, tell them to enable the "Allow AI to trade" toggle first.`}

When analyzing, respond with:
- Asset and direction (BUY/SELL)
- Suggested entry price range
- Stop loss and take profit levels
- Risk assessment (Low/Medium/High)
- Brief reasoning

Keep responses concise and actionable. Use bullet points.
Always include a disclaimer that this is AI-generated analysis and not financial advice.`,
    };

    // Non-streaming approach when tools are available and trading is enabled
    if (trading_enabled && user_id) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [systemMessage, ...messages],
          tools,
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits depleted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await aiResponse.text();
        console.error("AI gateway error:", status, t);
        return new Response(JSON.stringify({ error: "AI service unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let result = await aiResponse.json();
      let choice = result.choices?.[0];
      
      // Tool call loop — execute tools and continue conversation
      const conversationMessages = [systemMessage, ...messages];
      let maxIterations = 5;
      
      while (choice?.finish_reason === "tool_calls" && choice?.message?.tool_calls?.length && maxIterations > 0) {
        maxIterations--;
        const toolCalls = choice.message.tool_calls;
        
        // Add assistant message with tool calls
        conversationMessages.push(choice.message);
        
        // Execute each tool call
        for (const tc of toolCalls) {
          const args = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
          const toolResult = await executeTool(tc.function.name, args, user_id, supabase, trading_enabled);
          conversationMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: toolResult,
          });
        }

        // Continue conversation with tool results
        const followUp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: conversationMessages,
            tools,
          }),
        });
        
        if (!followUp.ok) break;
        result = await followUp.json();
        choice = result.choices?.[0];
      }

      const content = choice?.message?.content || "I executed the trade. Please check your positions.";
      
      // Check if any tool was executed to signal the client to refresh
      const toolsExecuted = conversationMessages.some(m => m.role === "tool");
      
      return new Response(JSON.stringify({ 
        content,
        tool_executed: toolsExecuted,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming mode (no tools / trading disabled)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [systemMessage, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits depleted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-trading error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
