
CREATE TABLE public.client_crypto_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency text NOT NULL,
  address text NOT NULL DEFAULT '',
  network text DEFAULT '',
  label text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, currency)
);

ALTER TABLE public.client_crypto_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage crypto addresses"
ON public.client_crypto_addresses
FOR ALL TO authenticated
USING (has_permission(auth.uid(), 'users.manage'))
WITH CHECK (has_permission(auth.uid(), 'users.manage'));

CREATE POLICY "Users read own crypto addresses"
ON public.client_crypto_addresses
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_crypto_addresses
  BEFORE UPDATE ON public.client_crypto_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
