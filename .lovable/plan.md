

## Problem

The white cards in dark mode (`.gradient-primary` and `.finance-hero-card`) currently have a very slow, barely perceptible gradient animation (`darkCardShimmer` at 120s duration). The user wants them to remain predominantly white but feel more alive with a visible animation effect.

## Plan

### 1. Speed up the gradient shimmer animation
- Change `darkCardShimmer` duration from `120s` to `8s` on both `.dark .gradient-primary` and `.dark .finance-hero-card` so the subtle blue tint movement is actually perceivable.

### 2. Add a shine sweep effect to `.dark .gradient-primary`
- Add a `::after` pseudo-element with the same `cardShineSwipe` animation already used on `.finance-hero-card::before` — a diagonal light streak that sweeps across the card every ~6s. This gives the white cards that premium "glass reflection" feel.

### 3. Enhance the gradient color stops slightly
- Make the blue accent stops in the dark mode white cards slightly more saturated (from `234 35% 90%` → `220 50% 88%`) so the color movement is more visible while keeping the card predominantly white.

### Files to edit
- **`src/index.css`**: 
  - Update `.dark .gradient-primary` animation duration and gradient stops
  - Update `.dark .finance-hero-card` animation duration and gradient stops  
  - Add `::after` shine sweep pseudo-element to `.gradient-primary` (similar to existing `.finance-hero-card::before`)

