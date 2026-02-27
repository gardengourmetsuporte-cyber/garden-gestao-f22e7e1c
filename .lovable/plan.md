

## Root Cause Analysis

The infinite loading has three distinct root causes:

### 1. AuthContext: Double initialization race
Both `onAuthStateChange(INITIAL_SESSION)` and `getSession()` fire independently. They both call `fetchUserData()`, and if `onAuthStateChange` fires first, it calls `fetchUserData` via `setTimeout(0)`. Then `getSession()` resolves and calls `fetchUserData` again. If the first call's `setIsLoading(false)` runs before the second call starts, there's no issue — but if `getSession().then()` errors or hangs (network), `isLoading` stays `true` forever. The watchdog is the only safety net.

### 2. UnitContext: fetchUnits recreated mid-flight
`fetchUnits` has `[user, isSuperAdmin]` as `useCallback` dependencies. Auth resolves in two phases: first `user` is set (triggering fetchUnits), then `isSuperAdmin` changes when profile loads (recreating `fetchUnits` → effect re-runs → `setIsLoading(true)` again). This second run races with the first, and the `effectiveLoading` compound check `(!!user && fetchedForUserRef.current !== user.id)` adds a third condition that can keep loading stuck if any fetch path misses updating the ref.

### 3. No deduplication or abort on concurrent fetches
Neither context guards against overlapping async calls. A slow first fetch + fast second fetch can leave stale state.

---

## Implementation Plan

### Step 1: Fix AuthContext — eliminate watchdog, add deterministic completion

- Remove the 12s watchdog `useEffect` (lines 66-75)
- Add `.catch()` to `getSession()` so network failures always call `setIsLoading(false)`
- Use an `isMounted` ref to prevent state updates after unmount
- Track fetch-in-progress via ref to avoid double `fetchUserData` calls from both `onAuthStateChange` and `getSession`
- Ensure `fetchUserData` always resolves `isLoading` to false (already does via `finally`)

### Step 2: Fix UnitContext — eliminate watchdog, stabilize dependencies

- Remove the 12s watchdog `useEffect` (lines 41-51)
- Read `isSuperAdmin` via a ref instead of as a `useCallback` dependency, so `fetchUnits` is only recreated when `user` changes (not when role loads)
- Add a fetch sequence counter (`fetchIdRef`) — each call increments it; when async work completes, only the latest call applies state updates. This deduplicates concurrent runs.
- Simplify `effectiveLoading`: remove the `fetchedForUserRef` compound check. Instead, just use `isLoading || authLoading`. The fetch counter ensures loading is only set to false by the last fetch.
- Add `.catch()` guards on all Supabase calls within `fetchUnits` to ensure `setIsLoading(false)` always runs (already has try/finally, but inner branches need protection)

### Step 3: Add getSession error handling

- In `AuthContext`, wrap the `getSession().then(...)` with a `.catch()` that logs the error and calls `setIsLoading(false)` + `clearCachedAuth()`, preventing the app from hanging on network failures during initial load.

---

### Files to modify
- `src/contexts/AuthContext.tsx`
- `src/contexts/UnitContext.tsx`

