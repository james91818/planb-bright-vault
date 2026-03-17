
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create roles table (dynamic, not enum)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Create role_permissions join table
CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  UNIQUE (user_id, role_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manager_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create team_members table
CREATE TABLE public.team_members (
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security definer: check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id AND p.key = _permission_key
  )
$$;

-- Security definer: check if user has a specific role by name
CREATE OR REPLACE FUNCTION public.has_role_by_name(_user_id UUID, _role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id AND r.name = _role_name
  )
$$;

-- RLS Policies

-- Profiles: users read own, admins read all
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.has_permission(auth.uid(), 'users.manage'));
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Roles: authenticated can read, only roles.manage can write
CREATE POLICY "Authenticated can read roles" ON public.roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert roles" ON public.roles
  FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'roles.manage'));
CREATE POLICY "Admins can update roles" ON public.roles
  FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'roles.manage'));
CREATE POLICY "Admins can delete roles" ON public.roles
  FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'roles.manage'));

-- Permissions: authenticated can read
CREATE POLICY "Authenticated can read permissions" ON public.permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'roles.manage'));

-- Role permissions: authenticated can read, admins can write
CREATE POLICY "Authenticated can read role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert role_permissions" ON public.role_permissions
  FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'roles.manage'));
CREATE POLICY "Admins can delete role_permissions" ON public.role_permissions
  FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'roles.manage'));

-- User roles: admins can manage, users can read own
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_permission(auth.uid(), 'users.manage'));
CREATE POLICY "Admins can manage user_roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'users.manage'));

-- Teams: team members/managers can read, admins can manage
CREATE POLICY "Read teams" ON public.teams
  FOR SELECT TO authenticated USING (
    public.has_permission(auth.uid(), 'users.manage')
    OR manager_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = id AND tm.user_id = auth.uid())
  );
CREATE POLICY "Admins can manage teams" ON public.teams
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'users.manage'));

-- Team members
CREATE POLICY "Read team_members" ON public.team_members
  FOR SELECT TO authenticated USING (
    public.has_permission(auth.uid(), 'users.manage')
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.manager_id = auth.uid())
  );
CREATE POLICY "Admins can manage team_members" ON public.team_members
  FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'users.manage'));

-- Seed default roles
INSERT INTO public.roles (name, description, is_system) VALUES
  ('Admin', 'Full access to all platform features', true),
  ('Manager', 'Can manage team leads and agents', true),
  ('Agent', 'Can manage own leads and clients', true);

-- Seed permissions
INSERT INTO public.permissions (key, label, category) VALUES
  ('leads.view_own', 'View Own Leads', 'Leads'),
  ('leads.view_team', 'View Team Leads', 'Leads'),
  ('leads.view_all', 'View All Leads', 'Leads'),
  ('leads.edit', 'Edit Leads', 'Leads'),
  ('leads.assign', 'Assign Leads', 'Leads'),
  ('clients.view_own', 'View Own Clients', 'Clients'),
  ('clients.view_team', 'View Team Clients', 'Clients'),
  ('clients.view_all', 'View All Clients', 'Clients'),
  ('clients.edit', 'Edit Clients', 'Clients'),
  ('trades.view', 'View Trades', 'Trades'),
  ('trades.manage', 'Manage Trades', 'Trades'),
  ('settings.view', 'View Settings', 'Settings'),
  ('settings.edit', 'Edit Settings', 'Settings'),
  ('users.manage', 'Manage Users', 'Users'),
  ('roles.manage', 'Manage Roles', 'Roles'),
  ('affiliates.manage', 'Manage Affiliates', 'Affiliates');

-- Seed default role-permission mappings
-- Agent permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'Agent' AND p.key IN ('leads.view_own', 'clients.view_own', 'leads.edit', 'trades.view');

-- Manager permissions (agent + team)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'Manager' AND p.key IN ('leads.view_own', 'clients.view_own', 'leads.edit', 'trades.view', 'leads.view_team', 'clients.view_team', 'leads.assign');

-- Admin permissions (all)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r, public.permissions p
WHERE r.name = 'Admin';
