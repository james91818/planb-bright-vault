
-- Fix permissive INSERT on activity_log - restrict to authenticated users inserting their own logs
DROP POLICY "System insert activity log" ON public.activity_log;
CREATE POLICY "Users insert own activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
