import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes   from './routes/auth.js'
import moviesRoutes from './routes/movies.js'
import chatRoutes   from './routes/chat.js'

const app  = express()
const PORT = process.env.PORT || 5000

// ── Middleware ──
app.use(cors({
  origin: (origin, callback) => {
    // Allow local dev and Vercel subdomains
    if (!origin || 
        origin === (process.env.FRONTEND_URL || 'http://localhost:5173') || 
        /^https:\/\/.*\.vercel\.app$/.test(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'), false)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Request logger (dev only) ──
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
  })
}

// ── Routes ──
app.use('/api/auth',   authRoutes)
app.use('/api/movies', moviesRoutes)
app.use('/api/chat',   chatRoutes)

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MoodFlix API', timestamp: new Date().toISOString() })
})

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

app.listen(PORT, () => {
  console.log(`
  🎬 MoodFlix API running on port ${PORT}
  📡 Health: http://localhost:${PORT}/api/health
  `)
})
