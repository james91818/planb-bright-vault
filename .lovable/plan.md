

# Roles & Permissions System for PlanB Trading

## Overview
Build a role-based access control (RBAC) system with three default roles (Agent, Manager, Admin) and a dynamic permissions system that admins can manage from a settings page.

---

## 1. Database Schema

### Tables

**`roles`** — Dynamic roles table (not an enum, so admins can add/edit roles)
- `id` (uuid, PK), `name` (text, unique), `description` (text), `is_system` (boolean, default false — prevents deletion of core roles), `created_at`
- Seed with: Agent, Manager, Admin

**`permissions`** — Available permissions in the platform
- `id` (uuid, PK), `key` (text, unique), `label` (text), `category` (text)
- Seed with permissions like: `leads.view_own`, `leads.view_team`, `leads.view_all`, `leads.edit`, `clients.view_own`, `clients.view_team`, `clients.view_all`, `clients.edit`, `trades.view`, `trades.manage`, `settings.view`, `settings.edit`, `users.manage`, `affiliates.manage`, `roles.manage`

**`role_permissions`** — Many-to-many join
- `role_id` (FK → roles), `permission_id` (FK → permissions), PK on both

**`user_roles`** — Assigns roles to users
- `id` (uuid, PK), `user_id` (FK → auth.users), `role_id` (FK → roles), unique on (user_id, role_id)

**`teams`** — For manager/agent grouping
- `id` (uuid, PK), `name` (text), `manager_id` (FK → auth.users), `created_at`

**`team_members`** — Agent assignments to teams
- `team_id` (FK → teams), `user_id` (FK → auth.users), PK on both

### RLS & Security
- `has_permission(user_id, permission_key)` — security definer function that checks user_roles → role_permissions → permissions
- All tables use RLS with admin-only write access; read access varies by role
- `has_role()` helper function as documented in the system guidelines

### Default Permission Mappings
- **Agent:** `leads.view_own`, `clients.view_own`, `leads.edit`, `trades.view`
- **Manager:** All agent permissions + `leads.view_team`, `clients.view_team`, `leads.assign`
- **Admin:** All permissions

---

## 2. Auth & Profiles

- Supabase Auth with email/password
- `profiles` table (id, email, full_name, avatar_url, status, created_at) with auto-create trigger on signup
- On login, fetch user's role and permissions, store in React context

---

## 3. Frontend Architecture

### Auth Pages
- `/login` — Email/password login
- `/signup` — Registration (default role: agent)

### Admin Settings — Roles & Permissions Page
- `/admin/settings/roles` — Table of all roles with edit/delete actions
- **Create/Edit Role dialog:** Name, description, and a grouped checkbox grid of all permissions (grouped by category)
- System roles (Agent, Manager, Admin) can be edited but not deleted
- Visual permission matrix: rows = permissions grouped by category, columns = checkboxes

### Permissions Context
- `useAuth()` hook providing user, role, and permissions
- `useHasPermission(key)` hook for conditional rendering
- `<RequirePermission permission="key">` wrapper component
- Route guards based on permissions

### Navigation
- Sidebar navigation that shows/hides items based on user permissions
- Admin sees Settings with Roles tab; others don't

---

## 4. File Structure

```text
supabase/
  migrations/
    001_create_roles_permissions.sql

src/
  contexts/AuthContext.tsx
  hooks/usePermission.ts
  components/auth/
    LoginPage.tsx
    SignupPage.tsx
    RequireAuth.tsx
    RequirePermission.tsx
  pages/
    admin/settings/RolesPage.tsx
  components/admin/
    RolesTable.tsx
    RolePermissionDialog.tsx
    PermissionMatrix.tsx
```

---

## 5. Implementation Order

1. Create all database tables, functions, RLS policies, and seed data via migration
2. Build auth context, login/signup pages, and route guards
3. Build admin settings page with Roles tab
4. Build role CRUD with permission matrix editor
5. Wire permission checks into navigation and route protection

