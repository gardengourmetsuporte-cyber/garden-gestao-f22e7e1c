

## Problem Analysis

The app has three distinct "color personalities" that don't feel unified:

1. **Landing page**: Green-to-cyan gradient CTAs (`--neon-green` → `--neon-cyan`), green badges, green glows
2. **Login page**: Blue (`--primary`) buttons, cyan/purple decorative glows, mixed identity
3. **Internal app**: Blue (`--primary`) as dominant, no green anywhere

The `--neon-green` brand color is exclusive to the landing page and disappears entirely once users enter the system. The login screen sits between both worlds without committing to either.

## Plan

### 1. Unify Landing page CTAs to use `--primary` instead of `--neon-green`

Replace all green-to-cyan gradient buttons and badges across landing components with the app's primary blue color:

- **HeroSection.tsx**: CTA button gradient → `--primary` solid/gradient, badge accent → `--primary`
- **CTASection.tsx**: CTA gradient → `--primary` based
- **PricingSection.tsx**: CTA buttons, "Mais popular" badge, "-20%" badge, "14 dias grátis" badge → `--primary`
- **SolutionSection.tsx**: Feature tags → `--primary`
- **LandingNavbar.tsx**: "Teste grátis" button → `--primary`
- **ProblemSection.tsx**: "O problema" label stays `--neon-red` (semantic, ok)
- **FAQSection.tsx** and section headers using `--neon-cyan`: keep as-is (cyan = primary hue 234°, already aligned)

### 2. Clean up Login page decorative elements

- Replace `--neon-purple` glow orb with `--primary` to match
- Remove the grid overlay pattern (visual noise, not present anywhere else)
- Simplify background to 1-2 subtle `--primary` based orbs

### 3. Standardize `--neon-green` token role

Keep `--neon-green` strictly as the semantic `--color-income` / success indicator color. Remove its use as a brand/CTA accent on the landing page. This ensures green = money/success everywhere, blue = brand/action everywhere.

### Technical Details

**Files to edit:**
- `src/components/landing/HeroSection.tsx` — CTA button + badge colors
- `src/components/landing/CTASection.tsx` — CTA button colors
- `src/components/landing/PricingSection.tsx` — CTA buttons + badges
- `src/components/landing/SolutionSection.tsx` — Feature tag badges
- `src/components/landing/LandingNavbar.tsx` — "Teste grátis" button
- `src/pages/Auth.tsx` — Background glow orbs cleanup

**Color mapping:**
- `linear-gradient(135deg, hsl(var(--neon-green)), hsl(var(--neon-cyan)))` → `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`
- `hsl(var(--neon-green) / 0.1)` backgrounds → `hsl(var(--primary) / 0.1)`
- `hsl(var(--neon-green))` text → `hsl(var(--primary))`
- Box shadows with green → box shadows with primary

