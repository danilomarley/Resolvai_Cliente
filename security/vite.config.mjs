import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()], envDir: false, envPrefix: 'SECURITY_TEST_',
  server: { host: '127.0.0.1', port: 4174, strictPort: true, proxy: { '/api': 'http://127.0.0.1:5175' } } })
