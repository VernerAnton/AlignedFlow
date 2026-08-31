import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

// Build identity, so the running app can say which build it actually is.
// The version people read is the hand-maintained counter in src/version.js;
// these two are the forensics behind it. Vercel exposes the commit as an env
// var; fall back to local git, then 'dev'. Wrapped in try/catch either way —
// a cosmetic label must never be able to fail a build.
const commit = (() => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  try { return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() }
  catch { return 'dev' }
})()

export default defineConfig({
  define: {
    __BUILD_COMMIT__: JSON.stringify(commit),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // We register the worker ourselves, in src/useAppUpdate.js. Left on
      // 'auto' the plugin injects its own registration, which under
      // 'autoUpdate' reloads the page the moment a new build activates —
      // and injecting it alongside ours would register the worker twice.
      injectRegister: null,
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
