
-- Add columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'not_submitted',
ADD COLUMN IF NOT EXISTS is_lead boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false;

-- Wallets table
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own wallets" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff manage wallets" ON public.wallets FOR ALL TO authenticated USING (has_permission(auth.uid(), 'users.manage'));

-- Deposits table
CREATE TABLE public.deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  method text NOT NULL DEFAULT 'crypto',
  status text NOT NULL DEFAULT 'pending',
  wallet_address text,
  proof_url text,
  admin_notes text,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own deposits" ON public.deposits FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_permission(auth.uid(), 'deposits.manage'));
CREATE POLICY "Users insert deposits" ON public.deposits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage deposits" ON public.deposits FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'deposits.manage'));

-- Withdrawals table
CREATE TABLE public.withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  method text NOT NULL DEFAULT 'crypto',
  status text NOT NULL DEFAULT 'pending',
  destination text,
  admin_notes text,
  processed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own withdrawals" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_permission(auth.uid(), 'withdrawals.manage'));
CREATE POLICY "Users insert withdrawals" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage withdrawals" ON public.withdrawals FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'withdrawals.manage'));

-- Assets table
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'crypto',
  enabled boolean NOT NULL DEFAULT true,
  leverage_max integer NOT NULL DEFAULT 100,
  icon_url text,
  market_hours_start time,
  market_hours_end time,
  market_days integer[] DEFAULT '{1,2,3,4,5}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read enabled assets" ON public.assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage assets" ON public.assets FOR ALL TO authenticated USING (has_permission(auth.uid(), 'assets.manage'));

-- Trades table
CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES public.assets(id) NOT NULL,
  direction text NOT NULL DEFAULT 'buy',
  order_type text NOT NULL DEFAULT 'market',
  entry_price numeric NOT NULL,
  current_price numeric,
  size numeric NOT NULL,
  leverage integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open',
  pnl numeric DEFAULT 0,
  stop_loss numeric,
  take_profit numeric,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own trades" ON public.trades FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_permission(auth.uid(), 'trades.manage'));
CREATE POLICY "Users insert trades" ON public.trades FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own open trades" ON public.trades FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_permission(auth.uid(), 'trades.manage'));

-- Trade overrides (admin only, hidden from clients)
CREATE TABLE public.trade_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id uuid REFERENCES public.trades(id) ON DELETE CASCADE NOT NULL UNIQUE,
  override_mode text NOT NULL DEFAULT 'none',
  target_value numeric,
  applied_by uuid REFERENCES auth.users(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trade_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff only trade overrides" ON public.trade_overrides FOR ALL TO authenticated USING (has_permission(auth.uid(), 'trades.manage'));

-- Price cache
CREATE TABLE public.price_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  price numeric NOT NULL,
  source text DEFAULT 'binance',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read prices" ON public.price_cache FOR SELECT TO authenticated USING (true);

-- Staking plans
CREATE TABLE public.staking_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  asset text NOT NULL,
  apy numeric NOT NULL,
  lock_period_days integer NOT NULL,
  min_amount numeric NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staking_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read staking plans" ON public.staking_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage staking plans" ON public.staking_plans FOR ALL TO authenticated USING (has_permission(auth.uid(), 'staking.manage'));

-- User stakes
CREATE TABLE public.user_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.staking_plans(id) NOT NULL,
  amount numeric NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  unlocks_at timestamptz NOT NULL,
  rewards_earned numeric DEFAULT 0,
  claimed boolean DEFAULT false
);
ALTER TABLE public.user_stakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own stakes" ON public.user_stakes FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_permission(auth.uid(), 'staking.manage'));
CREATE POLICY "Users insert stakes" ON public.user_stakes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage stakes" ON public.user_stakes FOR ALL TO authenticated USING (has_permission(auth.uid(), 'staking.manage'));

-- Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id OR has_permission(auth.uid(), 'support.manage'));
CREATE POLICY "Users insert tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff manage tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (has_permission(auth.uid(), 'support.manage'));

-- Ticket messages
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  message text NOT NULL,
  attachments text[],
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ticket participants read messages" ON public.ticket_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR has_permission(auth.uid(), 'support.manage')))
);
CREATE POLICY "Ticket participants insert messages" ON public.ticket_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR has_permission(auth.uid(), 'support.manage')))
);

-- Chat messages (live chat)
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat participants read" ON public.chat_messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR has_permission(auth.uid(), 'support.manage'));
CREATE POLICY "Chat participants insert" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR has_permission(auth.uid(), 'users.manage'));

-- Price alerts
CREATE TABLE public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES public.assets(id) NOT NULL,
  target_price numeric NOT NULL,
  direction text NOT NULL DEFAULT 'above',
  triggered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON public.price_alerts FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Watchlist
CREATE TABLE public.watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES public.assets(id) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, asset_id)
);
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON public.watchlist FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Referrals
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bonus_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  deposit_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own referrals" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR has_permission(auth.uid(), 'users.manage'));

-- Testimonials
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author text NOT NULL,
  content text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  is_default boolean NOT NULL DEFAULT false,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read testimonials" ON public.testimonials FOR SELECT USING (visible = true);
CREATE POLICY "Staff manage testimonials" ON public.testimonials FOR ALL TO authenticated USING (has_permission(auth.uid(), 'content.manage'));

-- News
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  source text,
  source_url text,
  image_url text,
  is_admin_post boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read news" ON public.news FOR SELECT USING (true);
CREATE POLICY "Staff manage news" ON public.news FOR ALL TO authenticated USING (has_permission(auth.uid(), 'content.manage'));

-- Activity log
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read activity log" ON public.activity_log FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'users.manage'));
CREATE POLICY "System insert activity log" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- Add new permissions for the platform
INSERT INTO public.permissions (key, label, category) VALUES
  ('deposits.manage', 'Manage Deposits', 'Finance'),
  ('withdrawals.manage', 'Manage Withdrawals', 'Finance'),
  ('trades.manage', 'Manage Trades', 'Trading'),
  ('assets.manage', 'Manage Assets', 'Trading'),
  ('staking.manage', 'Manage Staking', 'Trading'),
  ('support.manage', 'Manage Support', 'Support'),
  ('content.manage', 'Manage Content', 'Content')
ON CONFLICT (key) DO NOTHING;

-- Create trigger for handle_new_user (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER set_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_deposits_updated_at BEFORE UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_trade_overrides_updated_at BEFORE UPDATE ON public.trade_overrides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create default wallets for new users
CREATE OR REPLACE FUNCTION public.create_default_wallets()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.wallets (user_id, currency) VALUES
    (NEW.id, 'EUR'), (NEW.id, 'USD'), (NEW.id, 'GBP'),
    (NEW.id, 'CHF'), (NEW.id, 'AUD'), (NEW.id, 'CAD');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_user_created_wallets
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_wallets();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_cache;
