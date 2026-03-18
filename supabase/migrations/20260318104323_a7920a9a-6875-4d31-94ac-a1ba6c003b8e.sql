
-- Trigger: when deposit status changes to 'approved', credit the user's wallet
CREATE OR REPLACE FUNCTION public.credit_wallet_on_deposit_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Ensure wallet exists for this currency
    INSERT INTO public.wallets (user_id, currency, balance)
    VALUES (NEW.user_id, NEW.currency, NEW.amount)
    ON CONFLICT (user_id, currency)
    DO UPDATE SET balance = wallets.balance + NEW.amount, updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_credit_wallet_on_deposit
AFTER UPDATE ON public.deposits
FOR EACH ROW
EXECUTE FUNCTION public.credit_wallet_on_deposit_approval();

-- Trigger: when withdrawal status changes to 'approved', debit the user's wallet
CREATE OR REPLACE FUNCTION public.debit_wallet_on_withdrawal_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    UPDATE public.wallets
    SET balance = balance - NEW.amount, updated_at = now()
    WHERE user_id = NEW.user_id AND currency = NEW.currency;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_debit_wallet_on_withdrawal
AFTER UPDATE ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.debit_wallet_on_withdrawal_approval();

-- Add unique constraint on wallets(user_id, currency) if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallets_user_id_currency_key'
  ) THEN
    ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_currency_key UNIQUE (user_id, currency);
  END IF;
END $$;
