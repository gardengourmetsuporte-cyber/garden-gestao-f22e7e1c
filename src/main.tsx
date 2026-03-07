// entry
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";


// Garantir que os ícones Material Symbols só apareçam quando a fonte estiver realmente carregada
(function ensureMaterialSymbolsReady() {
  const root = document.documentElement;
  const fontQuery = '24px "Material Symbols Rounded"';

  const markReady = () => {
    root.classList.add('material-font-ready');
  };

  const tryMarkReady = () => {
    if ('fonts' in document && document.fonts.check(fontQuery)) {
      markReady();
    }
  };

  // Fallback para navegadores com bug no <link media="print" onload>
  if (!document.getElementById('material-symbols-runtime-fallback')) {
    const fallbackLink = document.createElement('link');
    fallbackLink.id = 'material-symbols-runtime-fallback';
    fallbackLink.rel = 'stylesheet';
    fallbackLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap';
    document.head.appendChild(fallbackLink);
  }

  if ('fonts' in document) {
    document.fonts.ready.then(tryMarkReady).catch(() => {});
    document.fonts.load(fontQuery).then(tryMarkReady).catch(() => {});
    // Fail-safe: nunca deixar ícones invisíveis mesmo se a checagem da fonte falhar
    setTimeout(markReady, 1200);
    return;
  }

  // Fallback extremo: manter ícones visíveis em navegadores legados
  markReady();
})();

// Force update: when a new service worker is installed, show update banner
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready
    .then((reg) => {
      // Check for updates on load
      reg.update().catch(() => {});

      // On visibility change (returning to app), check for updates with debounce
      let updateDebounce: ReturnType<typeof setTimeout> | null = null;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          if (updateDebounce) clearTimeout(updateDebounce);
          updateDebounce = setTimeout(() => {
            reg.update().catch(() => {});
            updateDebounce = null;
          }, 5000);
        }
      });

      // Auto-activate new service workers silently
      const activateWaiting = (sw: ServiceWorker) => {
        sw.postMessage({ type: 'SKIP_WAITING' });
      };

      if (reg.waiting) activateWaiting(reg.waiting);

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW?.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            activateWaiting(newSW);
          }
        });
      });
    })
    .catch(() => {});
}

// Fix: prevent page jump when virtual keyboard opens on iOS/mobile
if ("ontouchstart" in window) {
  let savedScrollY = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  document.addEventListener("focusin", (e) => {
    const target = e.target as HTMLElement;
    if (!(target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

    // Skip when dnd-kit is active to avoid scroll conflicts
    if (document.querySelector('[data-dnd-dragging], [data-rfd-draggable-context-id]')) return;

    const isInsideOverlay = target.closest(
      '[role="dialog"], [vaul-drawer], [data-radix-popper-content-wrapper], .sheet-content'
    );

    if (isInsideOverlay) {
      savedScrollY = window.scrollY;
      requestAnimationFrame(() => {
        window.scrollTo(0, savedScrollY);
      });
      // Single debounced fallback instead of multiple timeouts
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        window.scrollTo(0, savedScrollY);
        debounceTimer = null;
      }, 150);
    } else {
      setTimeout(() => {
        const scrollable = target.closest('.flex-1.overflow-y-auto, .overflow-y-auto');
        if (scrollable) {
          const targetRect = target.getBoundingClientRect();
          const containerRect = scrollable.getBoundingClientRect();
          const offset = targetRect.top - containerRect.top - containerRect.height / 3;
          scrollable.scrollTop += offset;
        }
      }, 350);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
