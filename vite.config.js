import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Build identity, so the running app can say which build it actually is.
// Vercel exposes the commit as an env var; fall back to local git, then 'dev'.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const commit = (() => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() }
  catch { return 'dev' }
})()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_COMMIT__: JSON.stringify(commit),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
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
