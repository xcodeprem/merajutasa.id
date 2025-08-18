import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/kpi': 'http://localhost:4620',
      '/under-served': 'http://localhost:4620',
      '/equity': 'http://localhost:4620',
      '/revocations': 'http://localhost:4620',
      '/feedback': 'http://localhost:4620',
      '/risk': 'http://localhost:4620',
      '/health': 'http://localhost:4620'
    }
  }
})
