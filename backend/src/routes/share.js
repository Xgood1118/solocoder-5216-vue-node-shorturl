import { Router } from 'express'
import { groupStore } from '../store/group.js'
import { shareStore } from '../store/share.js'
import { linkStore } from '../store/link.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

router.get('/link/:token', (req, res) => {
  const share = shareStore.getByToken(req.params.token)
  if (!share) return res.status(404).json({ error: '分享链接不存在或已过期' })

  const group = groupStore.getById(share.groupId)
  if (!group) return res.status(404).json({ error: '分组不存在' })

  res.json({
    group: { id: group.id, name: group.name, path: group.path },
    share: { token: share.token, expiresAt: share.expiresAt, expireHours: share.expireHours }
  })
})

router.get('/link/:token/links', (req, res) => {
  const share = shareStore.getByToken(req.params.token)
  if (!share) return res.status(404).json({ error: '分享链接不存在或已过期' })

  const group = groupStore.getById(share.groupId)
  if (!group) return res.status(404).json({ error: '分组不存在' })

  const { page = 1, pageSize = 20 } = req.query
  let list = linkStore.list({ groupId: share.groupId, status: 'active' })
  list = list.map(l => ({
    code: l.code,
    remark: l.remark,
    url: l.url,
    clicks: l.clicks,
    createdAt: l.createdAt
  }))
  const total = list.length
  const start = (page - 1) * pageSize
  list = list.slice(start, start + parseInt(pageSize))

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.use(authRequired)

router.post('/group/:id/users', (req, res) => {
  const { username } = req.body || {}
  const group = groupStore.getById(req.params.id)

  if (!group) return res.status(404).json({ error: '分组不存在' })
  if (req.user.role !== 'admin' && group.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限分享' })
  }
  if (!username) return res.status(400).json({ error: '用户名不能为空' })

  const updated = groupStore.share(req.params.id, username)
  res.json({ group: updated })
})

router.delete('/group/:id/users/:username', (req, res) => {
  const group = groupStore.getById(req.params.id)
  if (!group) return res.status(404).json({ error: '分组不存在' })
  if (req.user.role !== 'admin' && group.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限操作' })
  }

  const updated = groupStore.unshare(req.params.id, req.params.username)
  res.json({ group: updated })
})

router.post('/group/:id/link', (req, res) => {
  const { expireHours = 24 } = req.body || {}
  const group = groupStore.getById(req.params.id)

  if (!group) return res.status(404).json({ error: '分组不存在' })
  if (req.user.role !== 'admin' && group.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限分享' })
  }

  const validHours = [1, 24, 168]
  const hours = validHours.includes(parseInt(expireHours)) ? parseInt(expireHours) : 24

  const share = shareStore.createShareLink(req.params.id, hours)
  res.json({ share })
})

router.delete('/link/:token', (req, res) => {
  const share = shareStore.getByToken(req.params.token)
  if (!share) return res.status(404).json({ error: '分享链接不存在' })

  const group = groupStore.getById(share.groupId)
  if (!group) return res.status(404).json({ error: '分组不存在' })
  if (req.user.role !== 'admin' && group.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限操作' })
  }

  shareStore.revoke(req.params.token)
  res.json({ ok: true })
})

router.get('/group/:id/links', (req, res) => {
  const group = groupStore.getById(req.params.id)
  if (!group) return res.status(404).json({ error: '分组不存在' })
  if (req.user.role !== 'admin' && group.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限查看' })
  }

  const shares = shareStore.listByGroup(req.params.id)
  res.json({ shares })
})

export default router
