import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Lâmpada — Bíblia',
        short_name: 'Lâmpada',
        description: 'Leia a Bíblia completa, acompanhe seu progresso e siga planos de leitura.',
        id: './',
        lang: 'pt-BR',
        categories: ['books', 'lifestyle', 'education'],
        theme_color: '#14213d',
        background_color: '#14213d',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        shortcuts: [
          { name: 'Igreja', url: './#/igreja', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Bíblia', url: './#/biblia', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
          { name: 'Leitura de hoje', url: './#/estudos', icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }] },
        ],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/bible/'),
            handler: 'CacheFirst',
            options: { cacheName: 'bible-text', expiration: { maxEntries: 200 } },
          },
        ],
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
