
-- Fix the overly permissive insert policy on profiles
DROP POLICY "System can insert profiles" ON public.profiles;
CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
