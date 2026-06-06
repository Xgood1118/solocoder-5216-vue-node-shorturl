import { userStore } from '../store/user.js'

const SESSIONS = new Map()

export function authRequired(req, res, next) {
  const token = req.headers['x-auth-token'] || req.cookies?.token

  if (!token || !SESSIONS.has(token)) {
    return res.status(401).json({ error: '未登录' })
  }

  const session = SESSIONS.get(token)
  req.user = session.user
  next()
}

export function adminRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '未登录' })
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  next()
}

export function createSession(user) {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
  SESSIONS.set(token, { user, createdAt: Date.now() })
  return token
}

export function destroySession(token) {
  return SESSIONS.delete(token)
}

export function getSessionUser(token) {
  return SESSIONS.get(token)?.user || null
}
