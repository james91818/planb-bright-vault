
CREATE TABLE public.report_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sections jsonb NOT NULL DEFAULT '{"wallets": true, "trades": true, "deposits": true, "withdrawals": true, "staking": true, "pnl": true}'::jsonb,
  frequency text NOT NULL DEFAULT 'manual',
  enabled boolean NOT NULL DEFAULT false,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage report settings"
  ON public.report_settings FOR ALL
  TO authenticated
  USING (has_permission(auth.uid(), 'users.manage'::text))
  WITH CHECK (has_permission(auth.uid(), 'users.manage'::text));

CREATE POLICY "Users read own report settings"
  ON public.report_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
