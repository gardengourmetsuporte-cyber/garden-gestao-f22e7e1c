// entry
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

      // Flag: only reload when user explicitly clicks Update
      let userRequestedUpdate = false;

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (userRequestedUpdate) {
          window.location.reload();
        }
        // If user didn't request, do NOT reload — prevents random screen jumps
      });

      const showUpdateBanner = (waitingSW: ServiceWorker) => {
        // Remove any existing banner
        document.getElementById('sw-update-banner')?.remove();

        const banner = document.createElement('div');
        banner.id = 'sw-update-banner';
        banner.setAttribute('style', [
          'position:fixed', 'bottom:calc(80px + env(safe-area-inset-bottom, 0px))', 'left:16px', 'right:16px',
          'z-index:9999', 'display:flex', 'align-items:center', 'gap:12px',
          'padding:14px 18px', 'border-radius:16px',
          'background:hsl(var(--card))', 'border:1px solid hsl(var(--border))',
          'box-shadow:0 8px 30px rgba(0,0,0,0.4)',
          'color:hsl(var(--foreground))', 'font-family:system-ui,sans-serif', 'font-size:13px',
          'animation:slideUp .3s ease-out',
        ].join(';'));

        banner.innerHTML = `
          <span style="flex:1;line-height:1.4">Nova versão disponível ✨</span>
          <button id="sw-update-btn" style="
            padding:8px 16px;border-radius:10px;font-weight:600;font-size:13px;
            background:hsl(var(--primary));color:hsl(var(--primary-foreground));border:none;cursor:pointer;
            white-space:nowrap;
          ">Atualizar</button>
          <button id="sw-update-dismiss" style="
            background:none;border:none;color:hsl(var(--muted-foreground));cursor:pointer;
            font-size:18px;line-height:1;padding:0 4px;
          ">×</button>
        `;

        // Add slide-up animation
        const style = document.createElement('style');
        style.textContent = '@keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}';
        banner.appendChild(style);

        document.body.appendChild(banner);

        document.getElementById('sw-update-btn')!.onclick = () => {
          userRequestedUpdate = true;
          banner.remove();
          waitingSW.postMessage({ type: 'SKIP_WAITING' });
          // Fallback: if controllerchange doesn't fire in 3s, force reload
          setTimeout(() => {
            if (userRequestedUpdate) window.location.reload();
          }, 3000);
        };

        document.getElementById('sw-update-dismiss')!.onclick = () => {
          banner.remove();
        };
      };

      // When a new SW is installed and waiting, show the banner
      const handleWaiting = () => {
        if (reg.waiting) {
          showUpdateBanner(reg.waiting);
        }
      };

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        newSW?.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            handleWaiting();
          }
        });
      });

      // If there's already a waiting SW on load, show it
      handleWaiting();
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
