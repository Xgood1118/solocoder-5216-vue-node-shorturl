import { Router } from 'express'
import { groupStore } from '../store/group.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

router.use(authRequired)

router.get('/', (req, res) => {
  const groups = groupStore.listByCreator(req.user.username)
  res.json({ groups })
})

router.get('/tree', (req, res) => {
  const tree = groupStore.getTree(req.user.username)
  res.json({ tree })
})

router.get('/shared', (req, res) => {
  const groups = groupStore.listSharedWithUser(req.user.username)
  res.json({ groups })
})

router.post('/', (req, res) => {
  const { name, parentId } = req.body || {}
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '分组名不能为空' })
  }

  try {
    const group = groupStore.create({
      name: name.trim(),
      parentId: parentId || null,
      creator: req.user.username
    })
    res.status(201).json({ group })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.get('/:id', (req, res) => {
  const group = groupStore.getById(req.params.id)
  if (!group) return res.status(404).json({ error: '分组不存在' })

  if (req.user.role !== 'admin' &&
      group.creator !== req.user.username &&
      !group.sharedUsers?.includes(req.user.username)) {
    return res.status(403).json({ error: '无权限查看' })
  }

  res.json({ group })
})

router.put('/:id/rename', (req, res) => {
  const { name } = req.body || {}
  const group = groupStore.getById(req.params.id)

  if (!group) return res.status(404).json({ error: '分组不存在' })
  if (req.user.role !== 'admin' && group.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限修改' })
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '分组名不能为空' })
  }

  try {
    const updated = groupStore.rename(req.params.id, name.trim())
    res.json({ group: updated })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

router.delete('/:id', (req, res) => {
  const group = groupStore.getById(req.params.id)
  if (!group) return res.status(404).json({ error: '分组不存在' })
  if (req.user.role !== 'admin' && group.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限删除' })
  }

  groupStore.remove(req.params.id)
  res.json({ ok: true })
})

export default router
