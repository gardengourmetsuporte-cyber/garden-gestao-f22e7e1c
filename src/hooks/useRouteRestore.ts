import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_KEY = 'garden_last_route';

// Routes that should NOT be persisted
const IGNORE_ROUTES = ['/auth', '/landing', '/invite', '/onboarding'];

/**
 * Persists the current route to localStorage so the PWA can restore it
 * when iOS kills and restarts the app from background.
 */
export function useRoutePersist() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (!IGNORE_ROUTES.some(r => path.startsWith(r))) {
      try {
        localStorage.setItem(ROUTE_KEY, path);
      } catch {}
    }
  }, [location.pathname]);
}

/**
 * On mount, checks if there's a saved route and navigates to it.
 * Only runs once, only if we're on "/" (the default start_url).
 */
export function useRouteRestore() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only restore if we landed on the root (PWA restart scenario)
    if (location.pathname !== '/') return;

    try {
      const saved = localStorage.getItem(ROUTE_KEY);
      if (saved && saved !== '/' && !IGNORE_ROUTES.some(r => saved.startsWith(r))) {
        navigate(saved, { replace: true });
      }
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
