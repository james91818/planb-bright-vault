
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country'
  );

  -- Notify all admins and managers about the new lead
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT ur.user_id,
         'New Lead Registered',
         COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email) || ' just signed up.',
         'lead'
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE r.name IN ('Admin', 'Manager');

  RETURN NEW;
END;
$$;
