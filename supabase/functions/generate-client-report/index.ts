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

  const openTrades = trades.filter(t => t.status === "open");
  const closedTrades = trades.filter(t => t.status === "closed");
  const openPnl = openTrades.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const closedPnl = closedTrades.reduce((s, t) => s + Number(t.pnl || 0), 0);
  const totalPnl = openPnl + closedPnl;
  const totalBalance = wallets.reduce((s, w) => s + Number(w.balance || 0), 0);
  const totalDeps = deposits.filter(d => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0);
  const totalWds = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
  const totalStaked = stakes.reduce((s, st) => s + Number(st.amount || 0), 0);
  const totalRewards = stakes.reduce((s, st) => s + Number(st.rewards_earned || 0), 0);

  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; padding: 0; background: #f8fafc; line-height: 1.6; }
  .page { max-width: 800px; margin: 0 auto; background: #fff; }

  /* Header */
  .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: #fff; padding: 40px 48px 32px; }
  .header h1 { font-size: 28px; margin: 0 0 4px; font-weight: 700; letter-spacing: -0.5px; }
  .header .tagline { color: #94a3b8; font-size: 14px; margin: 0 0 20px; }
  .client-info { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; }
  .client-name { font-size: 18px; font-weight: 600; }
  .client-meta { font-size: 12px; color: #94a3b8; text-align: right; }
  .client-meta span { display: block; }

  /* Quick Overview Banner */
  .overview-banner { background: linear-gradient(135deg, #0f172a, #1e3a5f); margin: 0; padding: 24px 48px; }
  .overview-grid { display: flex; gap: 0; flex-wrap: wrap; }
  .overview-item { flex: 1; min-width: 120px; text-align: center; padding: 12px 8px; border-right: 1px solid rgba(255,255,255,0.1); }
  .overview-item:last-child { border-right: none; }
  .overview-item .ov-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .overview-item .ov-value { font-size: 22px; font-weight: 700; color: #fff; }
  .overview-item .ov-value.positive { color: #4ade80; }
  .overview-item .ov-value.negative { color: #f87171; }

  /* Content */
  .content { padding: 32px 48px 40px; }

  /* Section */
  .section { margin-bottom: 36px; page-break-inside: avoid; }
  .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .section-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .section-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; }
  .section-desc { font-size: 13px; color: #64748b; margin: 0 0 16px; padding-left: 42px; }

  /* Summary Cards */
  .cards { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .card { flex: 1; min-width: 130px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; text-align: center; }
  .card .c-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
  .card .c-value { font-size: 22px; font-weight: 700; color: #0f172a; }
  .card .c-value.positive { color: #16a34a; }
  .card .c-value.negative { color: #dc2626; }
  .card .c-hint { font-size: 10px; color: #94a3b8; margin-top: 4px; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 12px; }
  th { background: #f1f5f9; color: #475569; text-align: left; padding: 10px 12px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  tr:hover { background: #fafbfc; }
  .positive { color: #16a34a; font-weight: 600; }
  .negative { color: #dc2626; font-weight: 600; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
  .badge-open { background: #dbeafe; color: #1d4ed8; }
  .badge-closed { background: #f1f5f9; color: #64748b; }
  .badge-approved { background: #dcfce7; color: #16a34a; }
  .badge-pending { background: #fef3c7; color: #d97706; }
  .badge-rejected { background: #fee2e2; color: #dc2626; }

  /* Glossary */
  .glossary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px 24px; margin-top: 8px; }
  .glossary h4 { font-size: 13px; color: #475569; margin: 0 0 8px; font-weight: 700; }
  .glossary dl { margin: 0; font-size: 12px; }
  .glossary dt { font-weight: 600; color: #334155; margin-top: 6px; }
  .glossary dd { margin: 0 0 2px 0; color: #64748b; }

  /* Footer */
  .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 48px; text-align: center; }
  .footer p { margin: 0; font-size: 11px; color: #94a3b8; }
  .footer .support { margin-top: 8px; font-size: 12px; color: #64748b; }

  /* Print */
  @media print {
    body { background: #fff; }
    .page { box-shadow: none; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

<!-- Header -->
<div class="header">
  <h1>📊 Investment Report</h1>
  <p class="tagline">Your personalised financial summary — everything you need to know at a glance</p>
  <div class="client-info">
    <div class="client-name">${profile.full_name || profile.email}</div>
    <div class="client-meta">
      <span>Report Date: ${now}</span>
      <span>Period: ${drLabel}</span>
    </div>
  </div>
</div>

<!-- Quick Overview Banner -->
<div class="overview-banner">
  <div class="overview-grid">
    ${sections.wallets ? `<div class="overview-item"><div class="ov-label">Portfolio Value</div><div class="ov-value">${formatCurrency(totalBalance)}</div></div>` : ""}
    ${sections.pnl && trades.length > 0 ? `<div class="overview-item"><div class="ov-label">Total P&L</div><div class="ov-value ${totalPnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(totalPnl)}</div></div>` : ""}
    ${sections.deposits && deposits.length > 0 ? `<div class="overview-item"><div class="ov-label">Deposited</div><div class="ov-value positive">${formatCurrency(totalDeps)}</div></div>` : ""}
    ${sections.withdrawals && withdrawals.length > 0 ? `<div class="overview-item"><div class="ov-label">Withdrawn</div><div class="ov-value">${formatCurrency(totalWds)}</div></div>` : ""}
    ${sections.staking && stakes.length > 0 ? `<div class="overview-item"><div class="ov-label">Rewards Earned</div><div class="ov-value positive">${formatCurrency(totalRewards)}</div></div>` : ""}
  </div>
</div>

<div class="content">
`;

  // --- Portfolio Summary ---
  if (sections.wallets && wallets.length > 0) {
    html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#dbeafe;color:#2563eb;">💰</div>
        <h2 class="section-title">Portfolio Summary</h2>
      </div>
      <p class="section-desc">This section shows the total value of your account across all currencies. Your portfolio balance reflects the funds currently available in your account.</p>
      <div class="cards">
        <div class="card"><div class="c-label">Total Balance</div><div class="c-value">${formatCurrency(totalBalance)}</div><div class="c-hint">Combined value of all your assets</div></div>
        <div class="card"><div class="c-label">Currencies Held</div><div class="c-value">${wallets.length}</div><div class="c-hint">Number of different currencies</div></div>
      </div>
      <table><tr><th>Currency</th><th style="text-align:right">Balance</th></tr>`;
    wallets.forEach(w => {
      html += `<tr><td><strong>${w.currency}</strong></td><td style="text-align:right">${formatCurrency(Number(w.balance), w.currency)}</td></tr>`;
    });
    html += `</table>
    </div>`;
  }

  // --- Profit & Loss ---
  if (sections.pnl && trades.length > 0) {
    const winCount = closedTrades.filter(t => Number(t.pnl || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? ((winCount / closedTrades.length) * 100).toFixed(1) : "0.0";
    html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#dcfce7;color:#16a34a;">📈</div>
        <h2 class="section-title">Profit & Loss</h2>
      </div>
      <p class="section-desc">This is a summary of how your investments have performed. <strong>Open P&L</strong> shows the unrealised profit/loss on trades still active. <strong>Realised P&L</strong> shows the actual profit/loss from trades that have been closed.</p>
      <div class="cards">
        <div class="card"><div class="c-label">Open P&L</div><div class="c-value ${openPnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(openPnl)}</div><div class="c-hint">From ${openTrades.length} active position${openTrades.length !== 1 ? 's' : ''}</div></div>
        <div class="card"><div class="c-label">Realised P&L</div><div class="c-value ${closedPnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(closedPnl)}</div><div class="c-hint">From ${closedTrades.length} closed trade${closedTrades.length !== 1 ? 's' : ''}</div></div>
        <div class="card"><div class="c-label">Win Rate</div><div class="c-value">${winRate}%</div><div class="c-hint">${winCount} of ${closedTrades.length} trades profitable</div></div>
      </div>
      <div class="glossary">
        <h4>💡 What do these numbers mean?</h4>
        <dl>
          <dt>Open P&L (Unrealised)</dt><dd>The potential profit or loss from trades that are still running. This value changes as the market moves.</dd>
          <dt>Realised P&L</dt><dd>The actual profit or loss from trades that have been completed. This is the money you have gained or lost.</dd>
          <dt>Win Rate</dt><dd>The percentage of your closed trades that ended with a profit.</dd>
        </dl>
      </div>
    </div>`;
  }

  // --- Trades ---
  if (sections.trades && trades.length > 0) {
    html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#fef3c7;color:#d97706;">📋</div>
        <h2 class="section-title">Trading Activity</h2>
      </div>
      <p class="section-desc">A detailed list of all your trades during this period. Each row shows the asset traded, the direction (Buy or Sell), the price you entered at, and the current profit or loss.</p>
      <table>
        <tr><th>Asset</th><th>Direction</th><th style="text-align:right">Entry Price</th><th style="text-align:right">Size</th><th>Leverage</th><th style="text-align:right">P&L</th><th>Status</th><th>Date</th></tr>`;
    trades.forEach(t => {
      const pnl = Number(t.pnl || 0);
      const symbol = t.assets?.symbol || "—";
      const statusClass = t.status === "open" ? "badge-open" : "badge-closed";
      html += `<tr>
        <td><strong>${symbol}</strong></td>
        <td>${t.direction === "buy" ? "🟢 Buy" : "🔴 Sell"}</td>
        <td style="text-align:right">${formatCurrency(Number(t.entry_price))}</td>
        <td style="text-align:right">${Number(t.size).toFixed(4)}</td>
        <td>${t.leverage}x</td>
        <td style="text-align:right" class="${pnl >= 0 ? 'positive' : 'negative'}">${formatCurrency(pnl)}</td>
        <td><span class="badge ${statusClass}">${t.status}</span></td>
        <td>${new Date(t.opened_at).toLocaleDateString("en-GB")}</td>
      </tr>`;
    });
    html += `</table>
      <div class="glossary">
        <h4>💡 Understanding your trades</h4>
        <dl>
          <dt>Direction</dt><dd><strong>Buy</strong> means you expect the price to go up. <strong>Sell</strong> means you expect it to go down.</dd>
          <dt>Entry Price</dt><dd>The price at which your trade was opened.</dd>
          <dt>Size</dt><dd>The amount of the asset you are trading.</dd>
          <dt>Leverage</dt><dd>A multiplier that increases your trade exposure. For example, 10x means your gains and losses are multiplied by 10.</dd>
          <dt>P&L</dt><dd>Profit and Loss — the amount you have gained or lost on this trade so far.</dd>
        </dl>
      </div>
    </div>`;
  }

  // --- Deposits ---
  if (sections.deposits && deposits.length > 0) {
    html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#dcfce7;color:#16a34a;">💳</div>
        <h2 class="section-title">Deposits</h2>
      </div>
      <p class="section-desc">This section lists all the funds you have added to your account. Only <strong>approved</strong> deposits are counted toward your total.</p>
      <div class="cards">
        <div class="card"><div class="c-label">Total Deposited</div><div class="c-value positive">${formatCurrency(totalDeps)}</div><div class="c-hint">Approved deposits only</div></div>
        <div class="card"><div class="c-label">Transactions</div><div class="c-value">${deposits.length}</div><div class="c-hint">Total deposit requests</div></div>
      </div>
      <table><tr><th style="text-align:right">Amount</th><th>Currency</th><th>Method</th><th>Status</th><th>Date</th></tr>`;
    deposits.forEach(d => {
      const statusClass = d.status === "approved" ? "badge-approved" : d.status === "pending" ? "badge-pending" : "badge-rejected";
      html += `<tr>
        <td style="text-align:right"><strong>${Number(d.amount).toLocaleString()}</strong></td>
        <td>${d.currency}</td><td>${d.method}</td>
        <td><span class="badge ${statusClass}">${d.status}</span></td>
        <td>${new Date(d.created_at).toLocaleDateString("en-GB")}</td>
      </tr>`;
    });
    html += `</table>
    </div>`;
  }

  // --- Withdrawals ---
  if (sections.withdrawals && withdrawals.length > 0) {
    html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#fee2e2;color:#dc2626;">🏦</div>
        <h2 class="section-title">Withdrawals</h2>
      </div>
      <p class="section-desc">All withdrawal requests from your account are listed below. Approved withdrawals have been processed and sent to your chosen payment method.</p>
      <div class="cards">
        <div class="card"><div class="c-label">Total Withdrawn</div><div class="c-value negative">${formatCurrency(totalWds)}</div><div class="c-hint">Approved withdrawals only</div></div>
        <div class="card"><div class="c-label">Requests</div><div class="c-value">${withdrawals.length}</div><div class="c-hint">Total withdrawal requests</div></div>
      </div>
      <table><tr><th style="text-align:right">Amount</th><th>Currency</th><th>Method</th><th>Status</th><th>Date</th></tr>`;
    withdrawals.forEach(w => {
      const statusClass = w.status === "approved" ? "badge-approved" : w.status === "pending" ? "badge-pending" : "badge-rejected";
      html += `<tr>
        <td style="text-align:right"><strong>${Number(w.amount).toLocaleString()}</strong></td>
        <td>${w.currency}</td><td>${w.method}</td>
        <td><span class="badge ${statusClass}">${w.status}</span></td>
        <td>${new Date(w.created_at).toLocaleDateString("en-GB")}</td>
      </tr>`;
    });
    html += `</table>
    </div>`;
  }

  // --- Staking ---
  if (sections.staking && stakes.length > 0) {
    html += `
    <div class="section">
      <div class="section-header">
        <div class="section-icon" style="background:#ede9fe;color:#7c3aed;">🔒</div>
        <h2 class="section-title">Staking</h2>
      </div>
      <p class="section-desc">Staking means locking your assets for a set period to earn rewards. Below are your active and past stakes, including how much you've earned. The <strong>unlock date</strong> is when you can access your staked funds again.</p>
      <div class="cards">
        <div class="card"><div class="c-label">Total Staked</div><div class="c-value">${formatCurrency(totalStaked)}</div><div class="c-hint">Assets currently locked</div></div>
        <div class="card"><div class="c-label">Rewards Earned</div><div class="c-value positive">${formatCurrency(totalRewards)}</div><div class="c-hint">Income from staking</div></div>
        <div class="card"><div class="c-label">Active Stakes</div><div class="c-value">${stakes.filter(s => !s.claimed).length}</div><div class="c-hint">Currently locked positions</div></div>
      </div>
      <table><tr><th>Plan</th><th>Asset</th><th style="text-align:right">Amount</th><th>APY</th><th style="text-align:right">Rewards</th><th>Unlocks</th><th>Claimed</th></tr>`;
    stakes.forEach(st => {
      const plan = st.staking_plans;
      html += `<tr>
        <td><strong>${plan?.name || "—"}</strong></td>
        <td>${plan?.asset || "—"}</td>
        <td style="text-align:right">${Number(st.amount).toLocaleString()}</td>
        <td>${plan?.apy || 0}%</td>
        <td style="text-align:right" class="positive">${formatCurrency(Number(st.rewards_earned || 0))}</td>
        <td>${new Date(st.unlocks_at).toLocaleDateString("en-GB")}</td>
        <td>${st.claimed ? '<span class="badge badge-approved">Yes</span>' : '<span class="badge badge-pending">Not yet</span>'}</td>
      </tr>`;
    });
    html += `</table>
      <div class="glossary">
        <h4>💡 What is staking?</h4>
        <dl>
          <dt>APY (Annual Percentage Yield)</dt><dd>The yearly return rate you earn on your staked assets. For example, 12% APY means you earn 12% per year.</dd>
          <dt>Unlock Date</dt><dd>The date when your staked assets become available for withdrawal.</dd>
          <dt>Claimed</dt><dd>Whether you have already collected your earned rewards.</dd>
        </dl>
      </div>
    </div>`;
  }

  // --- Disclaimer / Footer ---
  html += `
</div><!-- end content -->

<div class="footer">
  <p>This report was generated automatically on ${now}. All figures are based on data available at the time of generation and may not reflect real-time market changes.</p>
  <p class="support">Questions about this report? Contact your account manager or reach out to our support team — we're here to help.</p>
</div>

</div><!-- end page -->
</body></html>`;

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

    const { user_id, sections, action, date_range } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const defaultSections = { wallets: true, trades: true, deposits: true, withdrawals: true, staking: true, pnl: true };
    const activeSections = sections || defaultSections;
    const range = getDateRange(date_range || "all");

    // Fetch all client data with optional date filtering
    const profilePromise = supabase.from("profiles").select("*").eq("id", user_id).single();
    const walletsPromise = supabase.from("wallets").select("*").eq("user_id", user_id);

    let tradesQuery = supabase.from("trades").select("*, assets(symbol, name)").eq("user_id", user_id).order("opened_at", { ascending: false }).limit(100);
    let depsQuery = supabase.from("deposits").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(100);
    let wdsQuery = supabase.from("withdrawals").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(100);
    let stakesQuery = supabase.from("user_stakes").select("*, staking_plans(name, asset, apy)").eq("user_id", user_id).order("started_at", { ascending: false });

    if (range.from) {
      tradesQuery = tradesQuery.gte("opened_at", range.from).lt("opened_at", range.to);
      depsQuery = depsQuery.gte("created_at", range.from).lt("created_at", range.to);
      wdsQuery = wdsQuery.gte("created_at", range.from).lt("created_at", range.to);
      stakesQuery = stakesQuery.gte("started_at", range.from).lt("started_at", range.to);
    }

    const [
      { data: profile },
      { data: wallets },
      { data: trades },
      { data: deps },
      { data: wds },
      { data: stakes },
    ] = await Promise.all([
      profilePromise, walletsPromise, tradesQuery, depsQuery, wdsQuery, stakesQuery,
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
      dateRangeLabel: dateRangeLabel(date_range || "all"),
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
