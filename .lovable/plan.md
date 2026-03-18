

## Plan: Add "Fichas" Module for Comanda/QR Code Order Management

The system already has all the infrastructure for comandas: the `ComandaScanner` component, `comanda_number` column in `tablet_orders`, and QR code scanning on tablets. What's missing is a dedicated management module on the admin side to view, track, and manage orders grouped by ficha/comanda number.

### What This Module Does

- Shows all active fichas (comandas) grouped by their number, with the associated table number
- Receives orders from tablets where customers scan their comanda QR code at the end of the order
- Allows operators to see which fichas are open, their total, and close them
- The table number is stored on the tablet and can only be changed with admin PIN (this already works via `TableConfigDialog`)

### Changes

**1. New page: `src/pages/Fichas.tsx`**
- Full-screen management view with the standard `AppLayout`
- Header with title "Fichas" and stats (active fichas count, total value)
- Grid of ficha cards, each showing:
  - Ficha/comanda number (large, prominent)
  - Table number association
  - Order count and total value
  - Status indicator (active orders in yellow, all completed in green)
  - Tap to expand and see individual orders + items
- Queries `tablet_orders` filtered by `comanda_number IS NOT NULL` for the active unit
- Groups orders by `comanda_number` to show consolidated ficha view
- Realtime subscription for live updates when new orders come in from tablets
- Empty state encouraging comanda QR code usage

**2. Route: `src/App.tsx`**
- Add `/fichas` route under `AuthenticatedRoutes` with `ProtectedRoute`
- Lazy import the new page

**3. Navigation entry**
- Add "Fichas" to the relevant navigation/menu config so it appears in the sidebar/bottom bar
- Icon: `receipt_long` (Material Symbol) or `Receipt`

**4. Ficha Detail Sheet**
- When tapping a ficha card, opens a `Sheet` showing:
  - All orders under that comanda number
  - Each order's items, time, status
  - Total accumulated
  - Action to close/finalize the ficha (marks all orders as delivered)
  - Action to print summary

### No Database Changes Required
All infrastructure (`tablet_orders.comanda_number`, `tablet_order_items`, etc.) already exists. This is purely a frontend module that reads existing data in a new grouped view.

### Visual Style
Following system patterns: `bg-card rounded-2xl`, borderless cards, circular icon containers with color-coded backgrounds, `text-primary` for active states, compact `text-[10px]` subtitles.

