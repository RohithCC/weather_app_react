import express    from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path       from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const PORT       = process.env.PORT || 3000
const DIST       = path.join(__dirname, 'dist')
const API_TARGET = 'http://203.201.62.116:8091'

console.log('=== server.js STARTING ===')
console.log('PORT:', PORT)
console.log('dist folder exists:', existsSync(DIST))
console.log('API target:', API_TARGET)

const app = express()

// 1️⃣ Proxy FIRST — before any static file middleware
app.use('/api', createProxyMiddleware({
  target:       API_TARGET,
  changeOrigin: true,
  secure:       false,
  pathRewrite:  { '^/api': '' },
  on: {
    proxyReq: (pReq, req) =>
      console.log(`[PROXY] → ${API_TARGET}${pReq.path}`),
    proxyRes: (pRes, req) =>
      console.log(`[PROXY] ← ${pRes.statusCode} ${req.url}`),
    error: (err, req, res) => {
      console.error('[PROXY ERROR]', err.message)
      res.status(502).json({ error: 'Proxy error', detail: err.message })
    },
  },
}))

// 2️⃣ Static files SECOND
app.use(express.static(DIST))

// 3️⃣ SPA fallback LAST
app.get('/{*path}', (_req, res) =>
  res.sendFile(path.join(DIST, 'index.html'))
)

app.listen(PORT, () => {
  console.log(`✅ Listening on port ${PORT}`)
})