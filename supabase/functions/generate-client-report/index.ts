import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportData {
  profile: any;
  wallets: any[];
  trades: any[];
  deposits: any[];
  withdrawals: any[];
  stakes: any[];
  sections: Record<string, boolean>;
  dateRangeLabel: string;
}

function getDateRange(range: string): { from: string | null; to: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(now.getTime() + 86400000).toISOString(); // tomorrow

  switch (range) {
    case "today":
      return { from: today.toISOString(), to };
    case "yesterday": {
      const y = new Date(today.getTime() - 86400000);
      return { from: y.toISOString(), to: today.toISOString() };
    }
    case "this_week": {
      const day = today.getDay();
      const mon = new Date(today.getTime() - ((day === 0 ? 6 : day - 1) * 86400000));
      return { from: mon.toISOString(), to };
    }
    case "last_week": {
      const day = today.getDay();
      const thisMon = new Date(today.getTime() - ((day === 0 ? 6 : day - 1) * 86400000));
      const lastMon = new Date(thisMon.getTime() - 7 * 86400000);
      return { from: lastMon.toISOString(), to: thisMon.toISOString() };
    }
    case "this_month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to };
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    case "last_90_days":
      return { from: new Date(now.getTime() - 90 * 86400000).toISOString(), to };
    case "this_year":
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to };
    default:
      return { from: null, to };
  }
}

function dateRangeLabel(range: string): string {
  const labels: Record<string, string> = {
    today: "Today",
    yesterday: "Yesterday",
    this_week: "This Week",
    last_week: "Last Week",
    this_month: "This Month",
    last_month: "Last Month",
    last_90_days: "Last 90 Days",
    this_year: "This Year",
    all: "All Time",
  };
  return labels[range] || "All Time";
}

function formatCurrency(n: number, currency = "EUR"): string {
  return `${currency === "EUR" ? "€" : currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function generateHtmlReport(data: ReportData): string {
  const { profile, wallets, trades, deposits, withdrawals, stakes, sections, dateRangeLabel: drLabel } = data;
  const now = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a2e; margin: 0; padding: 40px; background: #fff; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  h2 { font-size: 18px; color: #16213e; border-bottom: 2px solid #0f3460; padding-bottom: 6px; margin-top: 32px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
  th { background: #0f3460; color: #fff; text-align: left; padding: 8px 12px; }
  td { padding: 7px 12px; border-bottom: 1px solid #e0e0e0; }
  tr:nth-child(even) { background: #f8f9fa; }
  .positive { color: #16a34a; }
  .negative { color: #dc2626; }
  .summary-grid { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .summary-card { flex: 1; min-width: 140px; background: #f0f4f8; border-radius: 8px; padding: 16px; text-align: center; }
  .summary-card .label { font-size: 11px; color: #666; text-transform: uppercase; }
  .summary-card .value { font-size: 20px; font-weight: bold; margin-top: 4px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ccc; font-size: 11px; color: #999; text-align: center; }
</style>
</head>
<body>
<h1>Investment Report</h1>
<p class="subtitle">Prepared for <strong>${profile.full_name || profile.email}</strong> &mdash; ${now} &mdash; Period: <strong>${drLabel}</strong></p>
`;

  // Wallets / Portfolio
  if (sections.wallets && wallets.length > 0) {
    const totalBalance = wallets.reduce((s, w) => s + Number(w.balance || 0), 0);
    html += `<h2>Portfolio Summary</h2>`;
    html += `<div class="summary-grid">
      <div class="summary-card"><div class="label">Total Balance</div><div class="value">${formatCurrency(totalBalance)}</div></div>
      <div class="summary-card"><div class="label">Currencies</div><div class="value">${wallets.length}</div></div>
    </div>`;
    html += `<table><tr><th>Currency</th><th>Balance</th></tr>`;
    wallets.forEach(w => {
      html += `<tr><td>${w.currency}</td><td>${formatCurrency(Number(w.balance), w.currency)}</td></tr>`;
    });
    html += `</table>`;
  }

  // P&L
  if (sections.pnl && trades.length > 0) {
    const openTrades = trades.filter(t => t.status === "open");
    const closedTrades = trades.filter(t => t.status === "closed");
    const openPnl = openTrades.reduce((s, t) => s + Number(t.pnl || 0), 0);
    const closedPnl = closedTrades.reduce((s, t) => s + Number(t.pnl || 0), 0);
    html += `<h2>Profit &amp; Loss</h2>`;
    html += `<div class="summary-grid">
      <div class="summary-card"><div class="label">Open P&L</div><div class="value ${openPnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(openPnl)}</div></div>
      <div class="summary-card"><div class="label">Realized P&L</div><div class="value ${closedPnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(closedPnl)}</div></div>
      <div class="summary-card"><div class="label">Open Positions</div><div class="value">${openTrades.length}</div></div>
    </div>`;
  }

  // Trades
  if (sections.trades && trades.length > 0) {
    html += `<h2>Trades</h2><table><tr><th>Asset</th><th>Direction</th><th>Entry</th><th>Size</th><th>Leverage</th><th>P&L</th><th>Status</th><th>Date</th></tr>`;
    trades.forEach(t => {
      const pnl = Number(t.pnl || 0);
      const symbol = t.assets?.symbol || "—";
      html += `<tr>
        <td>${symbol}</td>
        <td>${t.direction}</td>
        <td>${formatCurrency(Number(t.entry_price))}</td>
        <td>${Number(t.size).toFixed(4)}</td>
        <td>${t.leverage}x</td>
        <td class="${pnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(pnl)}</td>
        <td>${t.status}</td>
        <td>${new Date(t.opened_at).toLocaleDateString("en-GB")}</td>
      </tr>`;
    });
    html += `</table>`;
  }

  // Deposits
  if (sections.deposits && deposits.length > 0) {
    const totalDeps = deposits.filter(d => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0);
    html += `<h2>Deposits</h2>`;
    html += `<div class="summary-grid"><div class="summary-card"><div class="label">Total Deposited</div><div class="value positive">${formatCurrency(totalDeps)}</div></div></div>`;
    html += `<table><tr><th>Amount</th><th>Currency</th><th>Method</th><th>Status</th><th>Date</th></tr>`;
    deposits.forEach(d => {
      html += `<tr><td>${Number(d.amount).toLocaleString()}</td><td>${d.currency}</td><td>${d.method}</td><td>${d.status}</td><td>${new Date(d.created_at).toLocaleDateString("en-GB")}</td></tr>`;
    });
    html += `</table>`;
  }

  // Withdrawals
  if (sections.withdrawals && withdrawals.length > 0) {
    const totalWds = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
    html += `<h2>Withdrawals</h2>`;
    html += `<div class="summary-grid"><div class="summary-card"><div class="label">Total Withdrawn</div><div class="value negative">${formatCurrency(totalWds)}</div></div></div>`;
    html += `<table><tr><th>Amount</th><th>Currency</th><th>Method</th><th>Status</th><th>Date</th></tr>`;
    withdrawals.forEach(w => {
      html += `<tr><td>${Number(w.amount).toLocaleString()}</td><td>${w.currency}</td><td>${w.method}</td><td>${w.status}</td><td>${new Date(w.created_at).toLocaleDateString("en-GB")}</td></tr>`;
    });
    html += `</table>`;
  }

  // Staking
  if (sections.staking && stakes.length > 0) {
    const totalStaked = stakes.reduce((s, st) => s + Number(st.amount || 0), 0);
    const totalRewards = stakes.reduce((s, st) => s + Number(st.rewards_earned || 0), 0);
    html += `<h2>Staking</h2>`;
    html += `<div class="summary-grid">
      <div class="summary-card"><div class="label">Total Staked</div><div class="value">${formatCurrency(totalStaked)}</div></div>
      <div class="summary-card"><div class="label">Total Rewards</div><div class="value positive">${formatCurrency(totalRewards)}</div></div>
    </div>`;
    html += `<table><tr><th>Plan</th><th>Asset</th><th>Amount</th><th>APY</th><th>Rewards</th><th>Unlocks</th><th>Claimed</th></tr>`;
    stakes.forEach(st => {
      const plan = st.staking_plans;
      html += `<tr>
        <td>${plan?.name || "—"}</td>
        <td>${plan?.asset || "—"}</td>
        <td>${Number(st.amount).toLocaleString()}</td>
        <td>${plan?.apy || 0}%</td>
        <td class="positive">${formatCurrency(Number(st.rewards_earned || 0))}</td>
        <td>${new Date(st.unlocks_at).toLocaleDateString("en-GB")}</td>
        <td>${st.claimed ? "Yes" : "No"}</td>
      </tr>`;
    });
    html += `</table>`;
  }

  html += `<div class="footer">This report was generated automatically. For questions, please contact support.</div>`;
  html += `</body></html>`;
  return html;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is staff
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: hasPerm } = await supabase.rpc("has_permission", {
      _user_id: caller.id, _permission_key: "users.manage",
    });
    if (!hasPerm) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, sections, action } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const defaultSections = { wallets: true, trades: true, deposits: true, withdrawals: true, staking: true, pnl: true };
    const activeSections = sections || defaultSections;

    // Fetch all client data
    const [
      { data: profile },
      { data: wallets },
      { data: trades },
      { data: deps },
      { data: wds },
      { data: stakes },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user_id).single(),
      supabase.from("wallets").select("*").eq("user_id", user_id),
      supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", user_id).order("opened_at", { ascending: false }).limit(100),
      supabase.from("deposits").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(100),
      supabase.from("withdrawals").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(100),
      supabase.from("user_stakes").select("*, staking_plans(name, asset, apy)").eq("user_id", user_id).order("started_at", { ascending: false }),
    ]);

    if (!profile) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reportData: ReportData = {
      profile,
      wallets: wallets ?? [],
      trades: trades ?? [],
      deposits: deps ?? [],
      withdrawals: wds ?? [],
      stakes: stakes ?? [],
      sections: activeSections,
    };

    const htmlReport = generateHtmlReport(reportData);

    if (action === "download") {
      return new Response(htmlReport, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="report-${profile.full_name || "client"}-${new Date().toISOString().slice(0, 10)}.html"`,
        },
      });
    }

    // For email action — return HTML and let the frontend handle it or integrate with email infra
    if (action === "email") {
      // Update last_sent_at
      await supabase.from("report_settings").upsert({
        user_id,
        sections: activeSections,
        last_sent_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({
        success: true,
        html: htmlReport,
        email: profile.email,
        message: "Report generated. Email sending requires email domain setup.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ html: htmlReport }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
