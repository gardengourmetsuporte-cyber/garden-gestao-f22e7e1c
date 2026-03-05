

## Plan: Default Access Levels for Owners and Employees

### Problem
Currently, when a unit is provisioned or an employee is invited, no access levels are pre-configured. This means:
- Owners/admins have "full access" by default (no access_level assigned) -- which works but isn't explicit
- Invited employees also get "full access" by default, which is too permissive
- Admins must manually create and assign access levels for every new employee

### Solution

**1. Auto-create two default access levels during unit provisioning**

In the `auto_provision_unit` SQL function, after creating the unit, insert two access levels:

- **"Acesso Completo"** (is_default = false, flagged as `is_system = true` or similar)
  - Contains ALL module keys (every parent + child)
  - Auto-assigned to the owner's `user_units.access_level_id`

- **"Funcionário"** (is_default = true — this is the default for new members)
  - Contains a curated subset: `checklists`, `checklists.complete`, `checklists.history`, `ranking`, `rewards`, `rewards.shop`, `cash-closing`, `cash-closing.create`, `deliveries`, `deliveries.view`, `deliveries.create`, `recipes`, `recipes.view`, `personal-finance`
  - Basically operational modules without admin/financial access

**2. Auto-assign "Funcionário" level to invited users**

In `src/pages/Invite.tsx` → `acceptInviteForUser`, after inserting into `user_units`, look up the unit's default access level (`is_default = true`) and set `access_level_id` on the new `user_units` row.

**3. Auto-assign on direct signup (non-invite flow)**

In `auto_provision_unit` SQL function, the owner gets the "Acesso Completo" level assigned directly to their `user_units` row.

### Database Migration

Add to `auto_provision_unit` function — after creating the unit and owner's `user_units` row:

```sql
-- Create default access levels
DECLARE
  al_full_id uuid;
  al_employee_id uuid;
  all_modules text[];

-- Full access level (all modules)
all_modules := ARRAY[
  'agenda','agenda.view','agenda.create','agenda.appointments',
  'copilot',
  'finance','finance.view','finance.create','finance.delete','finance.accounts','finance.categories','finance.reports','finance.planning','finance.credit_cards','finance.backup',
  'customers','customers.view','customers.create','customers.import','customers.delete',
  'inventory','inventory.view','inventory.create','inventory.delete','inventory.movements','inventory.invoices','inventory.smart_receiving',
  'orders','orders.view','orders.create','orders.receive','orders.quotations',
  'checklists','checklists.complete','checklists.manage','checklists.contest','checklists.history',
  'cash-closing','cash-closing.create','cash-closing.validate','cash-closing.view_history','cash-closing.integrate',
  'deliveries','deliveries.view','deliveries.create','deliveries.manage',
  'recipes','recipes.view','recipes.create','recipes.costs',
  'employees','employees.view','employees.manage','employees.payments','employees.schedule','employees.time_tracking','employees.performance','employees.bonus',
  'rewards','rewards.shop','rewards.manage','rewards.approve',
  'ranking',
  'personal-finance',
  'marketing','marketing.calendar','marketing.create','marketing.ai','marketing.brand_core',
  'menu-admin','menu-admin.view','menu-admin.products','menu-admin.categories','menu-admin.options','menu-admin.orders','menu-admin.tables','menu-admin.pdv','menu-admin.game',
  'whatsapp','whatsapp.conversations','whatsapp.settings','whatsapp.knowledge','whatsapp.orders',
  'settings','settings.team','settings.access_levels','settings.stock_categories','settings.suppliers','settings.units','settings.payment_methods','settings.recipe_costs','settings.rewards','settings.medals','settings.notifications','settings.profile','settings.audit','settings.checklist_management'
];

INSERT INTO access_levels (unit_id, name, description, modules, is_default)
VALUES (new_unit_id, 'Acesso Completo', 'Acesso total a todos os módulos', all_modules, false)
RETURNING id INTO al_full_id;

INSERT INTO access_levels (unit_id, name, description, modules, is_default)
VALUES (new_unit_id, 'Funcionário', 'Acesso operacional básico para funcionários', 
  ARRAY['checklists','checklists.complete','checklists.history','ranking','rewards','rewards.shop','cash-closing','cash-closing.create','deliveries','deliveries.view','deliveries.create','recipes','recipes.view','personal-finance'],
  true)
RETURNING id INTO al_employee_id;

-- Assign full access to owner
UPDATE user_units SET access_level_id = al_full_id
WHERE user_id = p_user_id AND unit_id = new_unit_id;
```

### Frontend Changes

**`src/pages/Invite.tsx`** — After inserting into `user_units`, fetch the default access level for the unit and update the row:

```typescript
// After insert into user_units
const { data: defaultLevel } = await supabase
  .from('access_levels')
  .select('id')
  .eq('unit_id', invite.unit_id)
  .eq('is_default', true)
  .maybeSingle();

if (defaultLevel) {
  await supabase.from('user_units')
    .update({ access_level_id: defaultLevel.id })
    .eq('user_id', userId)
    .eq('unit_id', invite.unit_id);
}
```

**`src/hooks/useAccessLevels.ts`** and **`src/components/settings/AccessLevelSettings.tsx`** — No structural changes needed. The pre-created levels will appear in the existing UI for admins to customize.

### Summary of Changes

| Area | Change |
|------|--------|
| DB migration | Update `auto_provision_unit` to create 2 default access levels and assign "Acesso Completo" to the owner |
| `src/pages/Invite.tsx` | Auto-assign default access level to invited users |
| No other files | Existing access level UI and `useUserModules` hook already handle everything correctly |

