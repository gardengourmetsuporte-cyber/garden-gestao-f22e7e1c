

## Plan: Add Sale Source Selector (Balcão / Mesa / Delivery)

Currently the PDV hardcodes `source: 'balcao'` when finalizing a sale. The user wants to choose between **Balcão**, **Mesa** (with table number), and **Delivery** (with customer info) before completing the sale.

### Changes

**1. `src/hooks/usePOS.ts`**
- Add `saleSource` state (`'balcao' | 'mesa' | 'delivery'`) defaulting to `'balcao'`
- Expose `saleSource` and `setSaleSource` in the return
- In `finalizeSale`, use `saleSource` instead of hardcoded `'balcao'`/`'pedido'`
- In `clearCart`, reset `saleSource` to `'balcao'`

**2. `src/pages/PDV.tsx` — Cart summary bar**
- Add a source selector row above the customer fields in the cart bar — 3 toggle chips: **Balcão**, **Mesa**, **Delivery**
- When **Mesa** is selected, show a table number input
- When **Delivery** is selected, show customer name + phone + address fields
- When **Balcão** is selected, show just the existing name/CPF fields
- Pass `saleSource` through to the payment flow

**3. `src/components/pdv/PaymentSheet.tsx`**
- Accept and display the sale source in the header summary (e.g., "Mesa 5" or "Delivery - João")
- Show source badge near the total so the operator confirms where the sale is going

### UI Design
The source selector will be compact chip-style buttons (similar to category chips) placed right above the customer info row in the cart panel:

```text
[ 🏪 Balcão ]  [ 🍽 Mesa __ ]  [ 🛵 Delivery ]
```

When Mesa is selected, an inline number input appears. When Delivery is selected, address/phone fields appear below.

