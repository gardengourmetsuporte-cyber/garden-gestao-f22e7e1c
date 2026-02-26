

## Problems Identified

1. **Save button not visible**: The sheet content scrolls but the action buttons (Excluir/Salvar) at the bottom get cut off behind the screen/bottom bar. They need to be sticky at the bottom.
2. **No quick date shortcuts**: When editing an overdue task, user must open the full calendar to change to "today". Need quick-access buttons like "Hoje", "Amanhã".

## Plan

### 1. Fix action buttons visibility
- Move the button group (`flex gap-2`) **outside** the scrollable form area
- Make the buttons sticky at the bottom of the sheet with a frosted background
- Add `pb-20` to the form content so it doesn't get hidden behind the sticky buttons

### 2. Add quick date shortcuts
- When `hasDate` is enabled, show a row of quick-pick chips: **Hoje**, **Amanhã**, **Próx. semana**
- Each chip sets `dueDate` with one tap
- Highlight the active chip if the current date matches
- Keep the calendar popover as a fallback for custom dates

### 3. File changes
- **`src/components/agenda/TaskSheet.tsx`**: 
  - Import `isToday`, `isTomorrow`, `addDays` from date-fns
  - Add quick date chips row below the Data toggle
  - Restructure the sheet to have a scrollable content area and a fixed bottom bar for the save/delete buttons

