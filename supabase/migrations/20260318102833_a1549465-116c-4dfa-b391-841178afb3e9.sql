CREATE TABLE public.lead_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT 'bg-muted text-muted-foreground',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read lead_statuses"
ON public.lead_statuses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Staff can manage lead_statuses"
ON public.lead_statuses FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'users.manage'::text))
WITH CHECK (has_permission(auth.uid(), 'users.manage'::text));

-- Seed default statuses
INSERT INTO public.lead_statuses (name, color, sort_order) VALUES
  ('active', 'bg-success/10 text-success', 1),
  ('No Answer', 'bg-yellow-500/10 text-yellow-600', 2),
  ('Call Back', 'bg-blue-500/10 text-blue-600', 3),
  ('New Registration', 'bg-primary/10 text-primary', 4),
  ('suspended', 'bg-destructive/10 text-destructive', 5),
  ('pending', 'bg-yellow-500/10 text-yellow-600', 6);