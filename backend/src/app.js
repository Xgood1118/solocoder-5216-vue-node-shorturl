import express from 'express'
import cors from 'cors'
import cron from 'node-cron'

import authRouter from './routes/auth.js'
import linksRouter from './routes/links.js'
import groupsRouter from './routes/groups.js'
import shareRouter from './routes/share.js'
import logsRouter from './routes/logs.js'
import statsRouter from './routes/stats.js'

import {
  checkCodeExists,
  checkStatus,
  checkPassword,
  resolveTarget,
  logVisit,
  redirect
} from './middleware/shorturl.js'

import { logStore } from './store/log.js'

const app = express()
const PORT = 3116

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.set('trust proxy', true)

app.get('/s/:code',
  checkCodeExists,
  checkStatus,
  checkPassword,
  resolveTarget,
  logVisit,
  redirect
)

app.use('/api/auth', authRouter)
app.use('/api/links', linksRouter)
app.use('/api/groups', groupsRouter)
app.use('/api/share', shareRouter)
app.use('/api/logs', logsRouter)
app.use('/api/stats', statsRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

cron.schedule('0 0 * * *', () => {
  const removed = logStore.cleanOld(7)
  console.log(`[Cron] Cleaned ${removed} old log entries`)
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: '服务器内部错误' })
})

app.listen(PORT, () => {
  console.log(`Short URL service running on http://localhost:${PORT}`)
  console.log('Default users: admin/admin123, user1/user123, user2/user123')
})
