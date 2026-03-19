
-- Drop the old trigger that only fires on UPDATE
DROP TRIGGER IF EXISTS trg_credit_wallet_on_deposit ON public.deposits;

-- Recreate it to fire on both INSERT and UPDATE
CREATE TRIGGER trg_credit_wallet_on_deposit
  AFTER INSERT OR UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.credit_wallet_on_deposit_approval();

-- Also fix the function to handle INSERT (where OLD is null)
CREATE OR REPLACE FUNCTION public.credit_wallet_on_deposit_approval()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status IS NULL OR OLD.status <> 'approved') THEN
    INSERT INTO public.wallets (user_id, currency, balance)
    VALUES (NEW.user_id, NEW.currency, NEW.amount)
    ON CONFLICT (user_id, currency)
    DO UPDATE SET balance = wallets.balance + NEW.amount, updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;
