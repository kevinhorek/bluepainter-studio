import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the Electron desktop shell can load dist/ via file://
  base: './',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  },
  optimizeDeps: {
    include: ['@bluepainter/shared/astSyncEngine', '@bluepainter/shared/receiptPolicy']
  }
})
