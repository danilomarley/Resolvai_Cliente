import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react()],
    server: { proxy: { '/api': {
      target: env.API_PROXY_TARGET || 'http://localhost:5172',
      changeOrigin: true,
      configure(proxy) {
        proxy.on('error', (_error, _request, response) => {
          if ('writeHead' in response && !response.headersSent && !response.writableEnded) {
            response.writeHead(503, { 'Content-Type': 'application/problem+json' })
            response.end(JSON.stringify({ status: 503, title: 'API indisponível', code: 'API_UNAVAILABLE' }))
          }
        })
      },
    } } },
  }
})
