import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import type { PluginOption } from 'vite'

// Base path is '/' for the local Termux server, the Electron-less desktop (DeX)
// and the bundled Capacitor APK. GitHub Pages serves from a sub-path, so the
// Pages workflow sets EMPIRE_BASE=/empire/ at build time.
const base = process.env.EMPIRE_BASE || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'favicon-32x32.png',
        'favicon-16x16.png',
        'apple-touch-icon.png',
        'icon.svg',
      ],
      // Relative srcs (no leading slash) resolve against the manifest's own URL,
      // so the same manifest works under '/' and under '/empire/' on Pages.
      manifest: {
        name: 'The Empire — Desktop OS',
        short_name: 'Empire',
        description: 'Your personal web desktop — 26 apps, one intelligence.',
        start_url: '.',
        scope: '.',
        // `id` is resolved against start_url's ORIGIN (its path is ignored), so a
        // root '/' would (a) collide with any other PWA on a shared origin like
        // github.io and (b) not identify *this* app under /empire/. A relative
        // path segment gives ONE stable identity (`<origin>/empire`) across every
        // deploy base — same-origin-valid, never the bare origin root.
        id: 'empire',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        background_color: '#03060e',
        theme_color: '#03060e',
        orientation: 'any',
        categories: ['utilities', 'productivity'],
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
        shortcuts: [
          { name: 'Hermes AI Chat', short_name: 'AI Chat', url: './?app=ai-chat' },
          { name: 'Search Apps', short_name: 'Search', url: './?search=true' },
        ],
      },
      workbox: {
        // Precache the whole built shell so the app launches fully offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,json}'],
        navigateFallback: base + 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Optional backend (same-origin on Termux, or a user-set remote URL):
            // serve from network, fall back to last good cache when offline.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'empire-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' ||
              url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ] as PluginOption[],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'state-vendor': ['zustand'],
        },
      },
    },
  },
})
