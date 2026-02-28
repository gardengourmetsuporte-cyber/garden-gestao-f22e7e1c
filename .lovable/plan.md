

## Plan: Orders Module Visual Overhaul — Emerald Premium

### Problem
The Orders page (`/orders`) uses generic flat `bg-card` and `bg-muted` styling that clashes with the emerald dark premium theme applied to the rest of the system. Cards look grey/dull, icon containers lack emerald glow, and the AnimatedTabs indicator doesn't match the new palette.

### Changes

**1. `src/components/ui/animated-tabs.tsx`** — Emerald active state
- Active tab indicator: change from `bg-card` to `bg-emerald-500/10` with `border-emerald-500/20` and subtle emerald glow shadow
- Active tab text: `text-emerald-400` instead of generic `text-foreground`
- Active badge: `bg-emerald-500/15 text-emerald-400`

**2. `src/pages/Orders.tsx`** — Supplier cards & order cards
- Supplier suggestion cards: replace `bg-card border-border` with `bg-[#0a1a10] border-emerald-500/10` and hover `border-emerald-500/25`
- Icon containers: from `bg-primary/10` to `bg-emerald-500/10` with `text-emerald-400`
- "+ Pedir" button shadow: `shadow-emerald-500/20`
- Status badges: update "Enviado" to `bg-emerald-500/10 text-emerald-400`
- Order history cards: same dark emerald card style
- Collapsible item rows: subtle `border-emerald-500/5` dividers
- WhatsApp button: keep existing green, ensure consistent `rounded-xl`
- Sheet (bottom): dark background `bg-[#0a1a10]` with emerald-tinted inputs

**3. `src/components/orders/QuotationList.tsx`** — Quotation cards
- Same dark emerald card background pattern
- Icon container: `bg-emerald-500/10 text-emerald-400`
- "Nova Cotacao" button: ensure `shadow-emerald-500/20`

**4. `src/components/orders/QuotationDetail.tsx`** — Detail view
- Supplier link cards: `bg-[#0a1a10] border-emerald-500/10`
- Table header: `bg-emerald-500/5` instead of `bg-secondary/30`
- Economy banner: already `bg-success/10` which maps to emerald -- keep

**5. `src/components/orders/QuotationSheet.tsx`** — Sheet styling
- Supplier chips selected state: `bg-emerald-500/15 border-emerald-500/30 text-emerald-400`
- Item selected state: `bg-emerald-500/5 border-emerald-500/20`

### Scope
- 5 files total
- All changes are CSS class swaps, no logic changes
- Consistent with emerald pattern used in MoreDrawer, FinanceBottomNav, and AppLayout

