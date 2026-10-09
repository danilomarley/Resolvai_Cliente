import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    server: { proxy: { '/api': { target: env.API_PROXY_TARGET || 'http://localhost:5172', changeOrigin: true } } },
  }
})
