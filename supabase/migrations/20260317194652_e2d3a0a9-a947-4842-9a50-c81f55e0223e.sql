
CREATE OR REPLACE FUNCTION public.auto_convert_depositor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a deposit is approved (status changed to 'approved') and amount >= 1
  IF NEW.status = 'approved' AND NEW.amount >= 1 THEN
    UPDATE public.profiles
    SET is_lead = false
    WHERE id = NEW.user_id AND is_lead = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_deposit_approved
  AFTER INSERT OR UPDATE ON public.deposits
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_convert_depositor();
