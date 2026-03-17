

# PlanB Trading Platform — Complete Plan

## Overview
A managed investment/trading platform where admins, managers, and agents fully control client trade outcomes behind the scenes. Clients see a professional trading platform with crypto/stock trading, fiat and crypto wallets, copy trading, staking, deposits, and live chat support. Affiliates send leads via API; leads become depositors after their first deposit.

---

## User Types & Roles

**Client types:**
- **Lead** — new user from affiliate, has not deposited yet
- **Depositor** — lead who deposited >= 1 EUR (auto-upgraded via DB trigger)

**Staff roles (hierarchy):**
- **Admin** — full control over everything
- **Manager** — controls trades for clients in their team
- **Agent** — controls trades for assigned clients only

---

## Database Schema

### Existing tables (keep as-is)
`profiles`, `roles`, `user_roles`, `permissions`, `role_permissions`, `teams`, `team_members`

### Profile changes
Add to `profiles`: `user_type` (text, default 'lead'), `affiliate_id` (uuid, nullable FK to affiliates), `phone` (text, nullable)

### New tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `wallets` | Fiat balances per user | user_id, currency (USD/EUR/GBP), balance |
| `crypto_holdings` | Crypto owned by user | user_id, symbol, quantity, avg_price |
| `trades` | All trading positions | user_id, symbol, asset_type, side (buy/sell), quantity, entry_price, close_price, status (open/closed/pending), is_controlled, controlled_outcome, profit_loss_amount |
| `trade_controls` | Staff outcome decisions (hidden from clients) | trade_id, controlled_by, target_outcome (profit/loss/breakeven), target_profit_percent, target_close_price, status (pending/applied/cancelled), notes |
| `deposits_withdrawals` | Deposit/withdraw requests | user_id, type (deposit/withdrawal), amount, currency, method (crypto/bank), status (pending/approved/rejected), proof_url, wallet_address, tx_hash, bank_reference |
| `notifications` | In-app notifications | user_id, title, message, type, read |
| `copy_trading_leaders` | Traders available to copy | user_id, display_name, total_return, win_rate, followers_count, is_active |
| `copy_trading_follows` | Who copies whom | follower_id, leader_id, allocation_percent, is_active |
| `staking_plans` | Admin-defined staking products | name, symbol, apy, lock_days, min_amount, is_active |
| `staking_positions` | User's staked crypto | user_id, plan_id, amount, start_date, end_date, status |
| `agent_client_assignments` | Agent-to-client mapping | agent_id, client_id, assigned_by |
| `chat_messages` | Live chat (client ↔ agent) | sender_id, receiver_id, message, read, created_at |
| `support_tickets` | Formal support requests | user_id, subject, description, status (open/in_progress/resolved/closed), priority, assigned_to |
| `watchlists` | User's watched assets | user_id, symbol, asset_type |
| `affiliates` | Affiliate partners | name, email, company, api_key, status (active/inactive), commission_type (CPA/rev_share/hybrid), commission_value |
| `affiliate_leads` | Leads per affiliate | affiliate_id, profile_id, status (lead/depositor/qualified), deposited_amount, conversion_date |

### Realtime
Enable realtime on: `chat_messages`, `notifications`, `trades`

### Database triggers
1. `update_updated_at` — on all tables with `updated_at`
2. `auto_upgrade_to_depositor` — on `deposits_withdrawals` when status = 'approved' and amount >= 1, update `profiles.user_type` to 'depositor' and `affiliate_leads.status` to 'depositor'
3. `auto_copy_trade` — on `trades` insert, create matching trades for followers of the leader

### RLS approach
- `trade_controls`: only staff with `trades.manage` permission — **completely invisible to clients**
- `trades`: clients see own trades (with `is_controlled` column excluded from client queries)
- `affiliates`, `affiliate_leads`: only staff with `affiliates.manage`
- `chat_messages`: sender or receiver only
- All other client tables: user sees own data, staff with `users.manage` sees all

### New permission keys
`trades.manage`, `trades.view_all`, `clients.assign`, `affiliates.manage`, `deposits.manage`, `staking.manage`

---

## Pages & Routes

### Public (no auth required)
| Route | Description |
|-------|-------------|
| `/` | Professional landing page — hero, stats, features, live ticker, testimonials, footer. Login button top-right in navbar |
| `/login` | Login form (email/password) — only via navbar click |
| `/signup` | Signup form |

### Client Dashboard (auth required)
| Route | Description |
|-------|-------------|
| `/dashboard` | Portfolio overview — total value, P&L, allocation chart |
| `/dashboard/portfolio` | Crypto holdings + open positions |
| `/dashboard/trade` | Buy/sell panel with live prices + advanced charts |
| `/dashboard/wallets` | Fiat & crypto balances |
| `/dashboard/deposit` | Deposit (crypto/bank) & withdrawal requests |
| `/dashboard/copy-trading` | Browse & follow leaders |
| `/dashboard/staking` | View plans, stake crypto |
| `/dashboard/news` | Market news feed |
| `/dashboard/chat` | Chat with agent + support tickets |

### Admin Panel (staff role required)
| Route | Description |
|-------|-------------|
| `/admin` | Overview dashboard with platform stats |
| `/admin/trade-control` | Control trade outcomes (win/lose/custom) |
| `/admin/users` | User management with lead/depositor filter |
| `/admin/deposits` | Approve/reject deposits & withdrawals |
| `/admin/affiliates` | Create/manage affiliates, download API docs per affiliate |
| `/admin/staking` | Manage staking plans |
| `/admin/chat` | View/respond to client chats & tickets |

---

## Landing Page Design
- **Navbar**: Logo "PlanB Trading" | Home | About | Features | **Login** button (top-right) | Theme toggle
- **Hero**: Bold headline, subtext, "Get Started" + "Learn More" CTAs, gradient background
- **Stats bar**: Animated counters (10K+ Users, $500M+ Volume, 200+ Assets)
- **Features**: 4 cards — Crypto Trading, Stock Trading, Copy Trading, Staking
- **Live ticker**: Scrolling top asset prices (BTC, ETH, AAPL, TSLA, etc.)
- **Testimonials**: 3 review cards
- **Footer**: Links, copyright, social icons
- **Light/dark mode** toggle in navbar

---

## Trade Control System (Hidden from Clients)
1. Client opens a trade → `status: open`
2. Staff views open trades at `/admin/trade-control`
3. Staff sets outcome: Win (+X%), Lose (-X%), or exact close price
4. System creates `trade_controls` record, closes trade at controlled price
5. Client sees normal market movement — no indication of manipulation
6. Client balance updates accordingly

---

## Deposits & Withdrawals
- **Crypto deposit**: Client provides tx hash/wallet address, admin verifies and credits
- **Bank transfer**: Client uploads proof, admin approves and credits
- **No real payment processing** — all balances admin-controlled
- Withdrawals go to admin approval queue
- Approved deposit >= 1 EUR auto-upgrades lead → depositor

---

## Copy Trading
- Real auto-copy: leader opens trade → followers auto-get same trade (scaled by allocation %)
- Leaders have visible performance stats
- Admin can still control outcomes of copied trades

---

## Affiliates System
- Admin creates affiliate with name, email, commission model, auto-generated API key
- **Download API doc** button generates markdown with: API key, endpoint URL, parameters, cURL example, error codes
- Edge function `affiliate-register`: POST with api_key + lead data → creates user with `user_type: 'lead'` and `affiliate_id`
- Dashboard shows leads count, depositors count, conversion rate per affiliate

---

## Chat & Support
- **Live chat**: Real-time messaging between client and assigned agent (realtime subscription on `chat_messages`)
- **Support tickets**: Formal requests with status tracking and priority

---

## Edge Functions
| Function | Purpose |
|----------|---------|
| `market-prices` | Proxy to CoinGecko (crypto) + free stock API, cached |
| `market-news` | Fetch crypto/stock news |
| `affiliate-register` | Register new leads via affiliate API key |

---

## Component Structure
- `src/components/landing/` — Navbar, HeroSection, StatsBar, FeaturesSection, LiveTicker, Testimonials, Footer
- `src/components/dashboard/` — Sidebar, PortfolioCard, TradePanel, WalletCard, ChartView, CopyTraderCard, StakingCard, ChatWidget
- `src/components/admin/` — AdminSidebar, TradeControlPanel, UserTable, DepositQueue, AffiliateManager, ApiDocGenerator
- `src/components/auth/` — LoginForm, SignupForm
- `src/components/ThemeToggle.tsx`
- `src/hooks/` — useAuth, useMarketPrices, useRealtime, usePermissions
- `src/contexts/` — AuthContext, ThemeContext

---

## Implementation Order
1. Database migrations (all tables + RLS + triggers + permissions)
2. Theme toggle + dark mode CSS
3. Landing page (navbar with Login button, hero, stats, features, ticker, testimonials, footer)
4. Auth pages (login/signup with email/password)
5. Auth context + route protection
6. Market data edge functions
7. Client dashboard (portfolio, wallets, trading panel, charts)
8. Deposit/withdrawal system with auto lead→depositor upgrade
9. Trade control panel (admin)
10. Affiliates admin + registration edge function + API doc download
11. Copy trading & staking
12. News feed & notifications
13. Chat + support tickets
14. Admin panel (users with lead/depositor filter, deposits, staking management)
15. Polish & testing

