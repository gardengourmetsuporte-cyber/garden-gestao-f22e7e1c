

## Plan: Standardize Navy Blue Gradient Across Light Theme

The user wants the animated navy-blue gradient (visible on checklist/finance hero cards) to be the unified brand surface for all key branded elements in the light theme.

### What changes

**1. `src/index.css` — Unify `.gradient-primary` (light) with the navy gradient**
- Replace the current muted dark-grey gradient in `.gradient-primary` (line 264) with the same animated navy gradient used by `.finance-hero-card` (lines 391-402)
- Use `navyCardFlow` animation instead of `darkCardShimmer`
- Keep the same `--foreground`, `--muted-foreground` token overrides for white-on-dark contrast

**2. `src/index.css` — Align `.finance-hero-card` (light) to match**
- Ensure `.finance-hero-card` uses the exact same gradient stops, animation, and border as `.gradient-primary` so they look identical

**3. `src/pages/Auth.tsx` — Apply gradient to login brand panel and mobile header**
- Update `BrandPanel` background (line 27) from the static dark gradient to the new animated navy gradient (same stops as finance-hero-card)
- Update `MobileBrandHeader` to include a navy gradient background card behind the logo

**4. `src/components/PageLoader.tsx` — Apply navy gradient background**
- Change the loader's background from `bg-background` to the navy gradient so the loading screen matches the branded look
- Adjust spinner and logo ring colors for contrast on dark background

### Files to modify
- `src/index.css` (gradient-primary + finance-hero-card alignment)
- `src/pages/Auth.tsx` (brand panel + mobile header)
- `src/components/PageLoader.tsx` (loader background)

