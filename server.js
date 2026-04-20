import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app  = express()
const PORT = process.env.PORT || 3000

app.use(cors())

// ── Proxy all /api calls → actual HTTP API server ──────────────────
app.use('/api', createProxyMiddleware({
  target:      'http://203.201.62.116:8091',
  changeOrigin: true,
  secure:       false,
  pathRewrite:  { '^/api': '' },
  on: {
    error: (err, req, res) => {
      console.error('Proxy error:', err.message)
      res.status(502).json({ error: 'API unreachable', detail: err.message })
    }
  }
}))

// ── Serve React build ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))