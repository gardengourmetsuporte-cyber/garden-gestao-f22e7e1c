

## Plan: Nest Production Card Inside Bonus Card

The Production card currently renders as a standalone full-width card between the Abertura/Fechamento row and the Bonus card. The user wants it nested inside the Bonus card as a thinner sub-card.

### Changes

**1. `src/components/checklists/ChecklistTypeCards.tsx`**
- Add `productionSlot` prop to `ChecklistBonusCard` (a `ReactNode`)
- Render the production slot inside the Bonus card, below the main content, as a compact sub-card with:
  - Thinner padding (`p-2.5` vs `p-5`)
  - Smaller icon (`w-8 h-8` vs `w-12 h-12`)
  - Smaller text (`text-sm` title, `text-[10px]` subtitle)
  - Subtle inner border (`border border-border/15 rounded-xl bg-secondary/30`)
  - Slim progress bar (`h-1`)
- Remove the standalone `ChecklistProductionCard` export (or keep for backward compat but unused)

**2. `src/pages/Checklists.tsx`**
- Move the Production card rendering logic from standalone to inside the `ChecklistBonusCard` via the new `productionSlot` prop
- Remove the standalone `{/* Production Card */}` block
- Pass a compact inline production sub-card as a child/slot to `ChecklistBonusCard`

### Visual Result
```text
┌──────────────┬──────────────┐
│  ☀ Abertura  │  🌙 Fecham.  │
└──────────────┴──────────────┘
┌─────────────────────────────┐
│ ⚡ Bônus        EXTRA PTS   │
│  Tarefas exclusivas...      │
│ ┌─────────────────────────┐ │
│ │ 🍳 Produção  2/5  40%  │ │  ← thinner sub-card
│ │ ████░░░░░░             │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

