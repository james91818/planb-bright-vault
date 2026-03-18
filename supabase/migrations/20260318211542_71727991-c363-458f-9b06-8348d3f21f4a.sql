
-- Add attachments column to admin_notes
ALTER TABLE public.admin_notes ADD COLUMN attachments text[] DEFAULT '{}';

-- Create storage bucket for comment attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('comment-attachments', 'comment-attachments', true);

-- RLS for storage: staff can upload
CREATE POLICY "Staff upload comment attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comment-attachments' AND has_permission(auth.uid(), 'users.manage'::text));

-- RLS for storage: anyone authenticated can read
CREATE POLICY "Authenticated read comment attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'comment-attachments');

-- RLS for storage: staff can delete
CREATE POLICY "Staff delete comment attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'comment-attachments' AND has_permission(auth.uid(), 'users.manage'::text));
