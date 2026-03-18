CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform_settings"
ON public.platform_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage platform_settings"
ON public.platform_settings FOR ALL
TO authenticated
USING (has_role_by_name(auth.uid(), 'Admin'))
WITH CHECK (has_role_by_name(auth.uid(), 'Admin'));

-- Seed default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('branding', '{"platform_name": "PlanB Trading", "tagline": "Your trusted trading partner", "support_email": "support@planb-trading.com"}'),
  ('localization', '{"default_currency": "EUR", "default_language": "en", "timezone": "Europe/Berlin"}'),
  ('registration', '{"enabled": true, "require_phone": true, "require_country": true, "allowed_countries": [], "blocked_countries": []}'),
  ('security', '{"session_timeout_minutes": 60, "max_login_attempts": 5, "lockout_duration_minutes": 15}'),
  ('notifications', '{"push_enabled": false, "email_on_deposit": true, "email_on_withdrawal": true, "email_on_login": false}'),
  ('landing', '{"hero_title": "Trade with Confidence", "hero_subtitle": "Access global markets with cutting-edge tools and expert support", "show_testimonials": true, "show_stats": true}');