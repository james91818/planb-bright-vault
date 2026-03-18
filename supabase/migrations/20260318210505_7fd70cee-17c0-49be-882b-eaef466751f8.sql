
CREATE TABLE public.client_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bank_name text NOT NULL DEFAULT '',
  account_holder text NOT NULL DEFAULT '',
  iban text NOT NULL DEFAULT '',
  swift_bic text DEFAULT '',
  reference text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.client_bank_details ENABLE ROW LEVEL SECURITY;

-- Staff can manage all bank details
CREATE POLICY "Staff manage bank details"
ON public.client_bank_details
FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'users.manage'))
WITH CHECK (has_permission(auth.uid(), 'users.manage'));

-- Clients can read their own bank details
CREATE POLICY "Users read own bank details"
ON public.client_bank_details
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_bank_details
  BEFORE UPDATE ON public.client_bank_details
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
