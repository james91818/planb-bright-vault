
ALTER TABLE public.admin_notes
ADD CONSTRAINT admin_notes_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id);
