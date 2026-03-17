

## Plan: Separate Leads/Clients from Staff/Agent Management

### Problem
Currently the admin sidebar mixes concepts: "Users" shows all profiles (including staff) with role assignment dropdowns, and "Roles" manages permissions. The user wants a clear separation:
- **Users** and **Depositors** = client accounts (leads/depositors) — should NOT show role assignment
- **Roles** = staff/agent account management only

### Changes

#### 1. Rename sidebar item "Users" to "Leads"
In `AppSidebar.tsx`, rename the "Users" nav item to "Leads" to clarify these are client accounts, not staff.

#### 2. Remove role assignment from AdminUsers (now "Leads") page
In `AdminUsers.tsx`:
- Remove the Role column from the table entirely (no role dropdown for clients)
- Filter out staff users — only show profiles where the user does NOT have a staff role (Admin/Manager/Agent)
- Rename the page heading from "Users" to "Leads"

#### 3. Remove role assignment from AdminDepositors page
Similarly ensure the Depositors page doesn't show any role-related controls (it currently doesn't, just verify).

#### 4. Create a dedicated "Agents" page (`AdminAgents.tsx`)
A new page at `/admin/agents` that:
- Shows only users who have a staff role (Admin, Manager, Agent)
- Allows assigning/changing roles for staff members
- Shows agent details: name, email, role, status, joined date
- Option to create a new agent (sign up + assign role)

#### 5. Update sidebar navigation
In `AppSidebar.tsx`, update the admin nav:
- "Leads" (was "Users") — `/admin/users`
- "Depositors" — `/admin/depositors`
- Add "Agents" with a `UserCheck` or `Shield` icon — `/admin/agents`
- Keep "Roles" for permission matrix management

#### 6. Add route for Agents page
Register `/admin/agents` in `App.tsx`.

### Summary of sidebar after changes
```text
Administration
├── Dashboard
├── Leads          (clients/prospects - no role column)
├── Depositors     (converted leads)
├── Agents         (staff accounts with role management)
├── Deposits
├── Withdrawals
├── Trades
├── Assets
├── News
├── Roles          (permission matrix for staff roles)
```

