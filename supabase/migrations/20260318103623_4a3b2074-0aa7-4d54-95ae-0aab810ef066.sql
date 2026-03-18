CREATE TABLE public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  company text,
  api_key text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage affiliates"
ON public.affiliates FOR ALL
TO authenticated
USING (has_role_by_name(auth.uid(), 'Admin'))
WITH CHECK (has_role_by_name(auth.uid(), 'Admin'));

CREATE UNIQUE INDEX affiliates_api_key_idx ON public.affiliates(api_key);