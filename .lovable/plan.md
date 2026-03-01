
## Problem

The `unitThemes.ts` file defines `STANDARD_THEME_COLORS` with `primary: '215 50% 28%'` — a blue hue. When `applyUnitTheme()` runs, it sets `--primary` on the document root to this blue value, overriding the emerald `156 72% 40%` defined in `index.css`. This makes all `text-primary`, `bg-primary`, `border-primary` etc. render blue instead of emerald green.

## Fix

Update `STANDARD_THEME_COLORS` in `src/lib/unitThemes.ts` to use the emerald primary color (`156 72% 40%`) instead of blue (`215 50% 28%`), matching the CSS theme. Update all related glow values accordingly.

### Changes

**`src/lib/unitThemes.ts`** — Replace the blue HSL values with emerald:
- `primary`: `215 50% 28%` → `156 72% 40%`
- `neonCyan`: same update
- `ring`: same update  
- `glowPrimary` and `glowCyan`: update the HSL references inside the box-shadow strings

This is a single-file, ~6 line change that will fix the blue color across the entire app, including the BottomBarTabPicker and all other components using `primary`.
