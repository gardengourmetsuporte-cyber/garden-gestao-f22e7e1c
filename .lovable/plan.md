

## Plan: Modernize Employee List Layout

### Changes

#### 1. `src/hooks/useEmployees.ts` — Join profile avatar
- After fetching employees, collect all `user_id`s and batch-query `profiles` table for `avatar_url`
- Merge `avatar_url` into each employee record (same pattern used in `useTimeTracking`, `useCashClosing`)

#### 2. `src/components/employees/EmployeeList.tsx` — Layout overhaul
- **Remove "Novo" button** from the search bar area
- **Register FAB action** via `useFabAction` to open the EmployeeSheet (consistent with other modules)
- **Replace icon placeholder** with `DefaultAvatar` component using employee name + user_id for deterministic gradient colors (and `avatar_url` from profiles when available)
- **Fix card layout**: Clean alignment — avatar left, name + role stacked, salary as a subtle badge on the right side instead of inline with role
- **Badges**: Move "Vinculado" and "Inativo" inline after name, smaller and more subtle
- **Cards**: Ensure proper `rounded-2xl` and consistent padding matching current design system
- **Search bar**: Keep standalone without the "Novo" button crowding it
- **Filter row**: Simplify the inactive toggle styling

#### 3. `src/pages/Employees.tsx` — Pass sheet control up
- The FAB needs to open the EmployeeSheet, so the sheet state (`sheetOpen`, `setSheetOpen`) will be managed in `EmployeeList` but triggered by FAB via `useFabAction`

### Summary of visual changes
- Employee photos (DefaultAvatar with initials gradient, or real avatar from profiles)
- Cleaner card alignment: avatar | name+role | salary
- "Novo" button moved to central FAB
- Consistent card radius and spacing with the rest of the app

