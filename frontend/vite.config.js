import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config.js lives inside /frontend/ — root is already correct.
// outDir: 'dist' puts build output at /frontend/dist/ which Vercel serves.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
