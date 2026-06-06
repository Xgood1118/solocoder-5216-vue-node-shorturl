import { Router } from 'express'
import { linkStore } from '../store/link.js'
import { logStore } from '../store/log.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

router.use(authRequired)

function isToday(ts) {
  const today = new Date()
  const d = new Date(ts)
  return d.getFullYear() === today.getFullYear()
    && d.getMonth() === today.getMonth()
    && d.getDate() === today.getDate()
}

function isThisWeek(ts) {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const weekStart = new Date(now.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  return ts >= weekStart.getTime()
}

router.get('/overview', (req, res) => {
  const isAdmin = req.user.role === 'admin'
  let allLinks = linkStore.list(isAdmin ? {} : { creator: req.user.username })

  const total = allLinks.length
  const active = allLinks.filter(l => l.status === 'active').length

  const todayNew = allLinks.filter(l => isToday(l.createdAt)).length

  const todayClicks = allLinks.reduce((sum, l) => {
    return sum + (isToday(l.lastVisitedAt) ? 1 : 0)
  }, 0)

  const weekClicks = allLinks.reduce((sum, l) => {
    return sum + (isThisWeek(l.lastVisitedAt) ? 1 : 0)
  }, 0)

  res.json({
    total,
    active,
    todayNew,
    todayClicks,
    weekClicks
  })
})

router.get('/top10', (req, res) => {
  const isAdmin = req.user.role === 'admin'
  let allLinks = linkStore.list(isAdmin ? {} : { creator: req.user.username })

  allLinks = allLinks
    .filter(l => isThisWeek(l.lastVisitedAt) || l.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
    .map(l => ({
      code: l.code,
      remark: l.remark,
      creator: l.creator,
      clicks: l.clicks,
      url: l.url
    }))

  res.json({ list: allLinks })
})

router.get('/trend', (req, res) => {
  const isAdmin = req.user.role === 'admin'
  let allLinks = linkStore.list(isAdmin ? {} : { creator: req.user.username })

  const days = 7
  const result = []

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const dayStart = d.getTime()
    const dayEnd = dayStart + 86400000

    const newCount = allLinks.filter(l => l.createdAt >= dayStart && l.createdAt < dayEnd).length

    const clickLogs = logStore.list({ startTime: dayStart, endTime: dayEnd })
    const clickCount = isAdmin
      ? clickLogs.length
      : clickLogs.filter(log => {
          const link = linkStore.getByCode(log.code)
          return link && link.creator === req.user.username
        }).length

    result.push({
      date: d.toISOString().slice(0, 10),
      newCount,
      clickCount
    })
  }

  res.json({ list: result })
})

export default router
