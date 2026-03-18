
-- Master traders / signal providers
CREATE TABLE public.copy_traders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  display_name text NOT NULL,
  avatar_url text,
  description text,
  win_rate numeric DEFAULT 0,
  total_pnl numeric DEFAULT 0,
  total_trades integer DEFAULT 0,
  followers_count integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  is_admin_managed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.copy_traders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read visible copy traders" ON public.copy_traders
  FOR SELECT TO authenticated USING (is_visible = true);

CREATE POLICY "Staff manage copy traders" ON public.copy_traders
  FOR ALL TO authenticated USING (has_permission(auth.uid(), 'trades.manage'));

-- Client subscriptions to copy traders
CREATE TABLE public.copy_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trader_id uuid NOT NULL REFERENCES public.copy_traders(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'auto',
  fixed_amount numeric DEFAULT 100,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, trader_id)
);

ALTER TABLE public.copy_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions" ON public.copy_subscriptions
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Staff read all subscriptions" ON public.copy_subscriptions
  FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'trades.manage'));

-- Copied trades log
CREATE TABLE public.copied_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.copy_subscriptions(id) ON DELETE CASCADE,
  source_trade_id uuid REFERENCES public.trades(id),
  user_id uuid NOT NULL,
  trade_id uuid REFERENCES public.trades(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.copied_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own copied trades" ON public.copied_trades
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Staff manage copied trades" ON public.copied_trades
  FOR ALL TO authenticated USING (has_permission(auth.uid(), 'trades.manage'));
