CREATE POLICY "Staff insert deposits"
ON public.deposits
FOR INSERT
TO authenticated
WITH CHECK (has_permission(auth.uid(), 'deposits.manage'::text));

CREATE POLICY "Staff insert withdrawals"
ON public.withdrawals
FOR INSERT
TO authenticated
WITH CHECK (has_permission(auth.uid(), 'withdrawals.manage'::text));