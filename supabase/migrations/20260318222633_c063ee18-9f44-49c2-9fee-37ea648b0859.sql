DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO public
  USING (
    auth.uid() = id
    OR has_permission(auth.uid(), 'users.manage'::text)
    OR assigned_agent = auth.uid()
  );