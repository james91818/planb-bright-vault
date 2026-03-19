
-- Fix trades SELECT policy to also allow staff with trades.view permission
DROP POLICY IF EXISTS "Users read own trades" ON public.trades;
CREATE POLICY "Users read own trades"
  ON public.trades FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR has_permission(auth.uid(), 'trades.manage')
    OR has_permission(auth.uid(), 'trades.view')
  );
