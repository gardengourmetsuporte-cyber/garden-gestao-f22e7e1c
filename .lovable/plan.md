

## Plan: Replace Purple Primary with Navy Blue System-Wide

### Root Cause
`src/lib/unitThemes.ts` defines `STANDARD_THEME_COLORS` with `primary: '234 89% 67%'` which is a bright purple/violet. When `applyUnitTheme()` runs, it overrides the CSS variable `--primary` from navy blue (`215 50% 28%`) to this purple.

### Changes

**`src/lib/unitThemes.ts`** — Update `STANDARD_THEME_COLORS` to use the navy blue from the CSS design system:
- `primary`: `234 89% 67%` → `215 50% 28%` (dark) / keep consistent
- `neonCyan`: `234 89% 67%` → `215 50% 28%`
- `ring`: `234 89% 67%` → `215 50% 28%`
- `glowPrimary` and `glowCyan`: update HSL references from `234 89% 67%` to `215 50% 28%`

This single file change propagates the navy blue across all units and all UI elements that reference `--primary`.

