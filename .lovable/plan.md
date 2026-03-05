

## Plan: Animated Loading Screen with Logo Icon

The current loading screen plays a video file. The user wants to replace it with a pure CSS/JS animation that uses the logo icon (`src/assets/logo.png`) and creates movement on the top portion (like leaves swaying), similar to what the video shows.

### Approach

**File: `src/components/PageLoader.tsx`**
- Remove the `<video>` element
- Display the logo icon centered on a black background
- Add CSS keyframe animations to simulate the top part of the logo (leaves/plant) moving:
  - A subtle **sway/rotation** animation on the logo itself
  - Animated **glow pulse** behind the logo in emerald tones
  - Floating **particle dots** rising from behind the logo to simulate organic movement
  - A gentle **scale breathing** effect

**File: `src/index.css`** (or inline styles)
- Add keyframes: `sway` (gentle rotation oscillation), `float-up` (particles rising), `glow-pulse` (background glow)

### Result
A lightweight, instant-loading animation that shows the Garden logo with organic leaf-like motion — no video download required, faster perceived load time.

