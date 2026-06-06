import { Router } from 'express'
import { logStore } from '../store/log.js'
import { linkStore } from '../store/link.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

router.use(authRequired)

router.get('/', adminRequired, (req, res) => {
  const { code, ip, startTime, endTime, page = 1, pageSize = 20 } = req.query

  const filters = {
    code,
    ip,
    startTime: startTime ? parseInt(startTime) : undefined,
    endTime: endTime ? parseInt(endTime) : undefined
  }

  let list = logStore.list(filters)
  const total = list.length

  const start = (page - 1) * pageSize
  list = list.slice(start, start + parseInt(pageSize))

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/mine', (req, res) => {
  res.status(404).json({ error: '请通过短码查看日志' })
})

router.get('/:code', (req, res) => {
  const { code } = req.params
  const { page = 1, pageSize = 20 } = req.query

  const link = linkStore.getByCode(code)
  if (!link) return res.status(404).json({ error: '短链不存在' })
  if (req.user.role !== 'admin' && link.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限查看' })
  }

  let list = logStore.list({ code })
  const total = list.length

  const start = (page - 1) * pageSize
  list = list.slice(start, start + parseInt(pageSize))

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

export default router
