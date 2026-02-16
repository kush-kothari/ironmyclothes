import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    // Don't pre-bundle these – pre-bundling breaks sql.js WASM (LinkError: function import requires a callable)
    exclude: ['jeep-sqlite', 'jeep-sqlite/loader', 'sql.js'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
