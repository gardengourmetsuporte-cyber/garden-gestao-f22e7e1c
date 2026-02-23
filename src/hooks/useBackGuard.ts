import { useEffect, useRef } from 'react';

/**
 * Protects an open Sheet/Drawer against the browser back gesture.
 * Pushes a dummy history entry when `isOpen` becomes true.
 * On popstate (back), calls `onClose` instead of navigating away.
 */
export function useBackGuard(isOpen: boolean, onClose: () => void) {
  const guardActive = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      guardActive.current = false;
      return;
    }

    // Push dummy entry
    const tag = { __backGuard: true };
    window.history.pushState(tag, '');
    guardActive.current = true;

    const onPopState = () => {
      if (guardActive.current) {
        guardActive.current = false;
        onClose();
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      // If sheet was closed programmatically (not via back), clean up the dummy entry
      if (guardActive.current) {
        guardActive.current = false;
        // Only go back if the current history state is our guard entry
        const state = window.history.state;
        if (state && typeof state === 'object' && '__backGuard' in state) {
          window.history.back();
        }
      }
    };
  }, [isOpen, onClose]);
}
