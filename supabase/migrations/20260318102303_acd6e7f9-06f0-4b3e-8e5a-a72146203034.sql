CREATE POLICY "Staff update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (has_permission(auth.uid(), 'users.manage'::text))
WITH CHECK (has_permission(auth.uid(), 'users.manage'::text));