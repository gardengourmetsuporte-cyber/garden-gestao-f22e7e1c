import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      selfDestroying: false,
      includeAssets: ["favicon.ico", "lovable-uploads/**/*"],
      manifest: {
        name: "Garden Gestão",
        short_name: "Garden",
        description: "Sistema completo de gestão empresarial",
        theme_color: "#0c1120",
        background_color: "#0c1120",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        // @ts-ignore - share_target is a valid PWA manifest field
        share_target: {
          action: "/share-receipt",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            title: "title",
            text: "text",
            url: "url",
            files: [
              { name: "receipt", accept: ["image/*", "application/pdf"] },
            ],
          },
        },
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
        navigateFallbackAllowlist: [/^\/[^.]*$/],
        skipWaiting: false,
        clientsClaim: false,
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,ico,png,jpg,svg,woff2}"],
        importScripts: ["/push-sw.js"],
        cleanupOutdatedCaches: true,
        navigateFallback: "index.html",
        runtimeCaching: [
          // Supabase API — network-first, fallback to cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60, // 1h
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Supabase Storage (images) — cache-first
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Google Fonts stylesheets — stale-while-revalidate
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          // Google Fonts files — cache-first (immutable)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Leaflet tiles & CSS — cache-first
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "leaflet-assets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Supabase Auth — network-only (never serve stale auth)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    exclude: [],
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-js': ['@supabase/supabase-js'],
          'date-fns': ['date-fns'],
          'recharts': ['recharts'],
          'zod-hookform': ['zod', 'react-hook-form', '@hookform/resolvers'],
          'ui-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],
          'ui-styles': ['clsx', 'tailwind-merge', 'lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
}));
