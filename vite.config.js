import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AlignedFlow',
        short_name: 'AlignedFlow',
        description: 'Workday posture timer and evening stretch routine',
        theme_color: '#0f0e0c',
        background_color: '#0f0e0c',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon.jpg', sizes: '1024x1024', type: 'image/jpeg' }
        ]
      }
    })
  ]
})
