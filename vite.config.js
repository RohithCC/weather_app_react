import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target:       'http://203.201.62.116:8091',
        changeOrigin: true,
        secure:       false,
        rewrite:      (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log(`[PROXY] → ${req.url}`)
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[PROXY] ← ${proxyRes.statusCode} ${req.url}`)
          })
          proxy.on('error', (err) => {
            console.error('[PROXY ERROR]', err.message)
          })
        },
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})