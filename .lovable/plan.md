

## KDS - Kitchen Display System

### Overview
Create a dedicated public kitchen display page (`/kds/:unitId`) that shows active orders in real-time, optimized for a kitchen screen (TV/tablet). The kitchen staff can see incoming orders and mark items/orders as done.

### How It Works
- **Public route** (no auth required, like the tablet pages) at `/kds/:unitId`
- Shows orders from `tablet_orders` with statuses: `confirmed`, `preparing`, `ready`
- Real-time updates via Supabase Realtime (already configured for `tablet_orders`)
- Kitchen staff can advance order status: **Confirmed → Preparing → Ready**
- Auto-removes delivered/cancelled orders from view

### UI Design
- Full-screen grid layout (3-4 columns on large screens, 2 on tablets)
- Each order is a card showing: order number, source (mesa/delivery), time elapsed, items list
- Color-coded by status: yellow (confirmed/waiting), orange (preparing), green (ready)
- Large touch-friendly buttons to advance status
- Audio alert on new orders (optional browser notification)
- Auto-refresh every 10s + realtime websocket
- Dark theme by default for kitchen visibility

```text
┌──────────────────────────────────────────────────┐
│  🍳 KDS - Cozinha           [Unit Name]   12:45  │
├──────────┬──────────┬──────────┬─────────────────┤
│ #A1B2    │ #C3D4    │ #E5F6    │ #G7H8           │
│ Mesa 3   │ Delivery │ Mesa 7   │ Delivery        │
│ 5 min    │ 2 min    │ 8 min    │ 1 min           │
│──────────│──────────│──────────│─────────────────│
│ 2x Burger│ 1x Pizza │ 3x Açaí │ 1x Combo        │
│ 1x Fries │ 2x Refri │          │ 2x Suco         │
│          │          │          │                 │
│[PREPARAR]│[PRONTO ✓]│[PREPARAR]│[ACEITAR]        │
└──────────┴──────────┴──────────┴─────────────────┘
```

### Technical Plan

1. **Create `/src/pages/KDS.tsx`**
   - Fetches `tablet_orders` with items for the given `unitId`
   - Filters to active statuses only (`awaiting_confirmation`, `confirmed`, `preparing`, `ready`)
   - Subscribes to realtime changes
   - Plays audio beep on new order arrival
   - Sorts by creation time (oldest first)
   - Each card shows items, elapsed time (auto-updating), and action button

2. **Add route in `App.tsx`**
   - Add `/kds/:unitId` as a public route alongside existing tablet routes

3. **Reuse existing infrastructure**
   - Same `tablet_orders` table and status flow from `UnifiedOrdersPanel`
   - Same status update logic (direct Supabase update)
   - No new database changes needed

4. **KDS-specific features**
   - Timer on each card showing elapsed time since order creation
   - Cards sorted oldest-first (urgency)
   - "Bump" button to advance status
   - Visual alert when order exceeds time threshold (e.g., >10 min turns red)
   - Full-screen mode support
   - No scrolling needed — pagination by columns

