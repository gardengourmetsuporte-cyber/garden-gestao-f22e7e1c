

## Plan: "Gerenciar tela inicial" for Admin Dashboard

Add a Mobills-style widget manager at the bottom of the Admin Dashboard. Users can toggle visibility and reorder widgets via a full-screen Sheet with drag handles and switches. Preferences persist in localStorage.

### Widget Registry

Define a static list of dashboard widgets with keys, labels, and icons:

| Key | Label | Icon |
|-----|-------|------|
| `finance` | Saldo financeiro | Wallet |
| `finance-chart` | Gráfico financeiro | BarChart3 |
| `weekly-summary` | Resumo semanal | Calendar |
| `checklist` | Checklists | CheckSquare |
| `calendar` | Calendário | CalendarDays |
| `agenda` | Agenda | ListTodo |
| `pending-actions` | Ações pendentes | Bell |
| `leaderboard` | Ranking | Trophy |

### Changes

1. **New hook `src/hooks/useDashboardWidgets.ts`**
   - Reads/writes widget config from `localStorage` key `dashboard-widgets-config`
   - Default: all widgets visible, ordered as current layout
   - Exports `{ widgets, setWidgets, resetDefaults }` where each widget has `{ key, label, icon, visible, order }`

2. **New component `src/components/dashboard/DashboardWidgetManager.tsx`**
   - Sheet (bottom drawer) with title "Gerenciar tela inicial"
   - List of widgets with drag handle (GripVertical icon) + label + Switch toggle
   - Uses `@dnd-kit/sortable` for reordering (already installed)
   - Cancel / Save buttons in header

3. **Edit `src/components/dashboard/AdminDashboard.tsx`**
   - Import and use `useDashboardWidgets`
   - Add "Gerenciar tela inicial" button at bottom of dashboard (subtle, like Mobills)
   - Render widgets conditionally based on `visible` flag and in the persisted order
   - Keep `hasAccess()` as an AND condition (module access + widget visible)

