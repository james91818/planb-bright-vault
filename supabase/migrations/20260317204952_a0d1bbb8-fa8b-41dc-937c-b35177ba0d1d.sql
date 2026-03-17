
CREATE TABLE public.admin_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage admin notes"
ON public.admin_notes
FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'users.manage'))
WITH CHECK (public.has_permission(auth.uid(), 'users.manage'));
