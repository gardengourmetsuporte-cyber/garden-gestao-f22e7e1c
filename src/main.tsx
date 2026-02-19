// entry
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force update: when a new service worker is installed, reload immediately
if ('serviceWorker' in navigator) {
  // Force reload when new SW takes control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  // Aggressively update any waiting or installing SW
  navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) return;
    
    // If there's a waiting SW, skip waiting immediately
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // Watch for new SW installations
    reg.addEventListener('updatefound', () => {
      const newSW = reg.installing;
      newSW?.addEventListener('statechange', () => {
        if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
          newSW.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });

    // Force check for updates every time app loads
    reg.update().catch(() => {});
  });
}

// Fix: prevent page jump when virtual keyboard opens on iOS/mobile
if ("ontouchstart" in window) {
  // Record scroll position before focus to restore if browser jumps
  let savedScrollY = 0;

  document.addEventListener("focusin", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      // If inside a dialog/drawer/sheet, prevent the body from scrolling
      const isInsideOverlay = target.closest(
        '[role="dialog"], [vaul-drawer], [data-radix-popper-content-wrapper], .sheet-content'
      );

      if (isInsideOverlay) {
        // Freeze body scroll position to prevent the jump
        savedScrollY = window.scrollY;
        requestAnimationFrame(() => {
          window.scrollTo(0, savedScrollY);
        });
        // Also restore after iOS finishes its own adjustments
        setTimeout(() => window.scrollTo(0, savedScrollY), 50);
        setTimeout(() => window.scrollTo(0, savedScrollY), 150);
        setTimeout(() => window.scrollTo(0, savedScrollY), 350);
      } else {
        // For non-overlay inputs, gently scroll within nearest scrollable container
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
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
