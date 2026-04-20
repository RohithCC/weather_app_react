import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app  = express()
const PORT = process.env.PORT || 3000

// ── Proxy /api → real API ──────────────────────────────────────────
app.use('/api', createProxyMiddleware({
  target:      'http://203.201.62.116:8091',
  changeOrigin: true,
  secure:       false,
  pathRewrite:  { '^/api': '' },
}))

// ── Serve React build ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')))

// ✅ Fix: Express 5 uses '{*path}' instead of '*'
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))