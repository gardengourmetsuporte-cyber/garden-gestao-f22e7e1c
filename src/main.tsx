import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Fix: scroll focused inputs into view when virtual keyboard opens on iOS/mobile
if ("ontouchstart" in window) {
  document.addEventListener("focusin", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      // Skip if inside a Vaul drawer — Vaul handles its own positioning
      if (target.closest("[vaul-drawer]")) return;
      // Skip if inside a Radix dialog overlay (nested sheets)
      if (target.closest("[data-radix-popper-content-wrapper]")) return;

      setTimeout(() => {
        const scrollable = target.closest('[role="dialog"] .overflow-y-auto, .flex-1.overflow-y-auto');
        if (scrollable) {
          const targetRect = target.getBoundingClientRect();
          const containerRect = scrollable.getBoundingClientRect();
          const offset = targetRect.top - containerRect.top - containerRect.height / 3;
          scrollable.scrollTop += offset;
        }
        // Don't fallback to scrollIntoView — it causes the page jump bug
      }, 350);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
