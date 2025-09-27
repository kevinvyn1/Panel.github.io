import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(helmet())
app.use(cors({ origin: true, credentials: false }))
app.use(express.json({ limit: '256kb' }))
app.use(morgan('tiny'))

const PORT = process.env.PORT || 8080
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const SESSION_HOURS = Number(process.env.SESSION_HOURS || '2')
const USERNAME = process.env.USERNAME || 'admin'
const PASSWORD = process.env.PASSWORD || 'admin123'

// Rate limit for auth
const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false })
app.use('/api/auth/', authLimiter)

function signToken(username) {
  const expSec = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600
  return {
    token: jwt.sign({ sub: username, typ: 'access' }, JWT_SECRET, { algorithm: 'HS256', expiresIn: expSec - Math.floor(Date.now()/1000) }),
    expMs: expSec * 1000
  }
}

function authMiddleware(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'missing_token' })
  try {
    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    return next()
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {}
  if (String(username) !== USERNAME || String(password) !== PASSWORD) return res.status(401).json({ error: 'invalid_credentials' })
  const { token, expMs } = signToken(username)
  res.json({ token, exp: expMs })
})

app.get('/api/auth/ping', authMiddleware, (req, res) => {
  res.json({ ok: true })
})

// Demo protected data
let v1 = [{ user_id: '1001', num: 1, flag: true, name: 'Alice', created_at: new Date().toISOString() }]
let v2 = [{ user_id: '2001', key: 'KEY-ABC', status: 'active', name: 'Bob', created_at: new Date().toISOString() }]
let logs = ['server started at ' + new Date().toISOString()]

app.get('/api/whitelist/v1', authMiddleware, (req, res) => res.json(v1))
app.post('/api/whitelist/v1', authMiddleware, (req, res) => { const body = req.body || {}; v1.unshift({ ...body, created_at: new Date().toISOString() }); res.json({ ok: true }) })
app.get('/api/whitelist/v2', authMiddleware, (req, res) => res.json(v2))
app.post('/api/whitelist/v2', authMiddleware, (req, res) => { const body = req.body || {}; v2.unshift({ ...body, created_at: new Date().toISOString() }); res.json({ ok: true }) })
app.get('/api/logs', authMiddleware, (req, res) => res.type('text/plain').send(logs.join('\n')))

// Serve static frontend for convenience
const pubRoot = path.resolve(__dirname, '..')
app.use(express.static(pubRoot))

app.get('/', (req, res) => res.redirect('/login.html'))

app.listen(PORT, () => {
  console.log('server listening on http://localhost:' + PORT)
})
