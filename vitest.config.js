import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Kept apart from vite.config.js so the unit tests don't pull in the PWA
// plugin or shell out to git for the build stamp.
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_COMMIT__: JSON.stringify('test'),
    __BUILD_TIME__: JSON.stringify('test'),
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{js,jsx}'],
    setupFiles: ['tests/unit/setup.js'],
    restoreMocks: true,
  },
})
