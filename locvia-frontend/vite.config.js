import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    // ── Progressive Web App ──────────────────────────────────
    VitePWA({
      // 'autoUpdate' — service worker updates silently in the background.
      // On next page load the user gets the new version automatically.
      registerType: 'autoUpdate',

      // Dev mode: also register service worker during `npm run dev`
      // so PWA features can be tested without a production build.
      devOptions: {
        enabled: true,
        type: 'module',
      },

      // Files to include in the precache manifest
      includeAssets: [
        'favicon.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'offline.html',
      ],

      // ── Web App Manifest (injected automatically) ──────────
      // vite-plugin-pwa merges this with the public/manifest.json.
      // We keep public/manifest.json as the source of truth and
      // let the plugin inject the <link rel="manifest"> into index.html.
      manifest: {
        name: 'Locvia — Connecting You to Local',
        short_name: 'Locvia',
        description: 'Hyperlocal grocery delivery platform connecting you with fresh products from neighbourhood shops.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0c831f',
        orientation: 'portrait-primary',
        lang: 'en-IN',
        categories: ['shopping', 'food'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Browse Shops',
            short_name: 'Shops',
            description: 'Discover nearby local shops',
            url: '/customer/shops',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'My Orders',
            short_name: 'Orders',
            description: 'Track your orders',
            url: '/customer/orders',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },

      // ── Workbox Service Worker Configuration ───────────────
      workbox: {
        // Precache all static build output (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // ── Runtime caching strategies ─────────────────────
        runtimeCaching: [
          // Google Fonts — CacheFirst (fonts rarely change)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'locvia-google-fonts-stylesheets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'locvia-google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // External images (Unsplash CDN used in mock data) — CacheFirst
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'locvia-images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Spring Boot API calls — NetworkFirst with fallback
          // (no-op in mock phase; activates when VITE_API_BASE_URL is set)
          {
            urlPattern: /^http:\/\/localhost:8080\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'locvia-api',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // ── SPA navigateFallback ───────────────────────────────
        // For an SPA, all navigation requests must return index.html
        // so React Router can handle the UI.
        navigateFallback: '/index.html',

        // Don't apply navigateFallback to API calls or asset requests
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/icons\//,
          /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        ],
      },
    }),
  ],
});
