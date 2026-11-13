import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'pwa-192x192.png',
        'pwa-512x512.png',
        'apple-touch-icon.png',
        'favicon.png',
        'favicon-32x32.png',
        'maladh-logo-icon.png',
        'maladh-logo-lockup.png',
        'botanical-ivory.png',
        'botanical-night.png',
        'fonts/UthmanTN1-Ver10.woff2',
        'fonts/UthmanTN1B-Ver10.woff2',
        'fonts/AmiriQuran-Regular.woff2',
        'sounds/rain.mp3',
        'sounds/thunder.mp3',
        'sounds/waves.mp3',
        'sounds/river.mp3',
        'sounds/forest.mp3',
        'sounds/wind.mp3',
        'sounds/campfire.mp3',
        'sounds/night.mp3'
      ],
      manifest: {
        id: '/',
        name: 'مَلَاذْ',
        short_name: 'مَلَاذْ',
        description: 'رفيقك الروحي اليومي للأذكار، القرآن، والسبحة — يعمل محلياً وخاص بالكامل',
        theme_color: '#0A0D14',
        background_color: '#0A0D14',
        dir: 'rtl',
        lang: 'ar',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'any',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['sw-custom.js'],
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json,mp3}'],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.destination === 'audio' || url.pathname.startsWith('/sounds/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'maladh-offline-audio-v1',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/download\.quranicaudio\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'maladh-quran-audio-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome79', 'safari13'],
  }
})
