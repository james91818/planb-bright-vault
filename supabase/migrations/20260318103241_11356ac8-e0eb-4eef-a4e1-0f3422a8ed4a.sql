ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_deposit_at timestamptz DEFAULT NULL;

-- Update auto_convert_depositor to also set first_deposit_at
CREATE OR REPLACE FUNCTION public.auto_convert_depositor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND NEW.amount >= 1 THEN
    UPDATE public.profiles
    SET is_lead = false,
        first_deposit_at = COALESCE(first_deposit_at, now())
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Backfill existing depositors with their earliest approved deposit date
UPDATE public.profiles p
SET first_deposit_at = sub.min_date
FROM (
  SELECT user_id, MIN(created_at) as min_date
  FROM public.deposits
  WHERE status = 'approved'
  GROUP BY user_id
) sub
WHERE p.id = sub.user_id AND p.first_deposit_at IS NULL;