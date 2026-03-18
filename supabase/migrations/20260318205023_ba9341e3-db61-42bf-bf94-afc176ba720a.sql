
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  client_id uuid DEFAULT NULL,
  title text NOT NULL,
  description text DEFAULT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Agents can manage their own appointments
CREATE POLICY "Agents manage own appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- Managers and admins can view all appointments
CREATE POLICY "Managers view all appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    has_permission(auth.uid(), 'users.manage')
  );

-- Trigger for updated_at
CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
