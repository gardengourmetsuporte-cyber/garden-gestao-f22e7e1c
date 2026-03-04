

## Plan: Add 5 Custom SVG Icons

Extract SVG paths from the uploaded files and add them to `CUSTOM_SVG_PATHS` in `src/lib/iconMap.ts`, mapping them to the icon names used throughout the app.

### Icon → Feature Mapping

| SVG File | Icon Key(s) | Feature |
|---|---|---|
| refund-alt.svg | `Receipt` | Fechamento de Caixa |
| review.svg | `UserSearch`, `UserPlus`, `UserCheck` | Clientes |
| receipt.svg | `FileText` | Transações (Finance tab) |
| order-history.svg | `ShoppingCart`, `ShoppingBag` | Pedidos |
| notebook-alt.svg | `CalendarDays`, `Calendar` | Agenda |

### Technical Details

1. **`src/lib/iconMap.ts`** — Add 5 new entries to `CUSTOM_SVG_PATHS`:
   - `Receipt`: single path from refund-alt.svg (dollar sign with circular arrow)
   - `UserSearch`: two paths from review.svg (person + star rating)
   - `FileText`: single path from receipt.svg (receipt with torn bottom)
   - `ShoppingCart`: single path from order-history.svg (cart with clock)
   - `CalendarDays`: single path from notebook-alt.svg (spiral notebook)
   - Also alias `ShoppingBag` → same paths as `ShoppingCart`, `Calendar` → same as `CalendarDays`

2. No changes to `app-icon.tsx` — the existing custom SVG rendering logic already handles multi-path SVGs with `fill="currentColor"` and the `tab-icon-galaxy` active state fix.

