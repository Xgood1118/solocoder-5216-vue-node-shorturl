import { Router } from 'express'
import { createSession, destroySession, authRequired } from '../middleware/auth.js'
import { userStore } from '../store/user.js'

const router = Router()

router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  const user = userStore.verify(username, password)

  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = createSession(user)
  res.json({ token, user })
})

router.post('/logout', authRequired, (req, res) => {
  const token = req.headers['x-auth-token']
  if (token) destroySession(token)
  res.json({ ok: true })
})

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user })
})

router.get('/users', authRequired, (req, res) => {
  res.json({ users: userStore.list() })
})

export default router
