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
        'botanical-night.png'
      ],
      manifest: {
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
        orientation: 'portrait',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
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
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}']
      }
    })
  ]
})
