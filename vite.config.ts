import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the app under /<repo>/; set by the deploy workflow.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  // One offline bundle is fine for a PWA; charts and the barcode reader load on demand.
  build: { chunkSizeWarningLimit: 1200 },
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0') },
  plugins: [
    react(),
    VitePWA({
      // The user decides when to update (a banner), so a reload never interrupts work .
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Football Academy',
        short_name: 'Football',
        description: 'תוכנית אימונים לשנה, מעקב, תזונה ומיינדסט. הכול במכשיר.',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        theme_color: '#1f7a3a',
        background_color: '#ffffff',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
});
