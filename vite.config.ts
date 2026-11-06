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
      includeAssets: ['maladh-logo-icon.png', 'maladh-logo-lockup.png', 'botanical-ivory.png', 'botanical-night.png'],
      manifest: {
        name: 'مَلَاذْ — رفيقك الروحي اليومي',
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
            src: '/maladh-logo-icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/maladh-logo-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}']
      }
    })
  ]
})
