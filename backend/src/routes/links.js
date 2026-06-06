import { Router } from 'express'
import { linkStore } from '../store/link.js'
import { groupStore } from '../store/group.js'
import { generateShortCode, validateCustomCode } from '../utils/shortcode.js'
import { validateUrl } from '../utils/validator.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

router.use(authRequired)

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, keyword, status, groupId, creatorKeyword } = req.query

  const isAdmin = req.user.role === 'admin'
  const filters = { keyword, status, groupId, creatorKeyword }

  if (!isAdmin) {
    filters.creator = req.user.username
  }

  let list = linkStore.list(filters)
  const total = list.length

  const start = (page - 1) * pageSize
  list = list.slice(start, start + parseInt(pageSize))

  res.json({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.get('/:code', (req, res) => {
  const link = linkStore.getByCode(req.params.code)
  if (!link) return res.status(404).json({ error: '短链不存在' })

  if (req.user.role !== 'admin' && link.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限查看' })
  }

  res.json({ link })
})

router.post('/', (req, res) => {
  const { url, customCode, remark, groupId, expireDays, neverExpires, password, abTest } = req.body || {}

  const validation = validateUrl(url)
  if (!validation.valid) {
    return res.status(400).json({ error: validation.message })
  }

  if (abTest && abTest.enabled) {
    const vA = validateUrl(abTest.urlA)
    const vB = validateUrl(abTest.urlB)
    if (!vA.valid) return res.status(400).json({ error: 'A 链接：' + vA.message })
    if (!vB.valid) return res.status(400).json({ error: 'B 链接：' + vB.message })
  }

  let code
  if (customCode) {
    if (!validateCustomCode(customCode)) {
      return res.status(400).json({ error: '自定义短码格式不正确（4-20位字母数字下划线，不能是保留字）' })
    }
    if (linkStore.exists(customCode)) {
      return res.status(400).json({ error: '该短码已被占用' })
    }
    code = customCode
  } else {
    try {
      code = generateShortCode(c => linkStore.exists(c))
    } catch (e) {
      return res.status(500).json({ error: '生成短码失败，请重试' })
    }
  }

  const link = linkStore.create({
    code,
    url,
    remark,
    groupId,
    expireDays,
    neverExpires,
    password: password || null,
    abTest: abTest || null,
    creator: req.user.username
  })

  res.status(201).json({ link })
})

router.put('/:code', (req, res) => {
  const { remark, status, groupId, password } = req.body || {}
  const link = linkStore.getByCode(req.params.code)

  if (!link) return res.status(404).json({ error: '短链不存在' })
  if (req.user.role !== 'admin' && link.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限修改' })
  }

  const updates = {}
  if (remark !== undefined) updates.remark = remark
  if (status !== undefined) {
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ error: '状态无效' })
    }
    updates.status = status
  }
  if (groupId !== undefined) {
    if (groupId && !groupStore.getById(groupId)) {
      return res.status(400).json({ error: '分组不存在' })
    }
    updates.groupId = groupId
  }
  if (password !== undefined) {
    updates.password = password || null
  }

  const updated = linkStore.update(req.params.code, updates)
  res.json({ link: updated })
})

router.delete('/:code', (req, res) => {
  const link = linkStore.getByCode(req.params.code)
  if (!link) return res.status(404).json({ error: '短链不存在' })
  if (req.user.role !== 'admin' && link.creator !== req.user.username) {
    return res.status(403).json({ error: '无权限删除' })
  }

  linkStore.remove(req.params.code)
  res.json({ ok: true })
})

router.post('/batch/delete', (req, res) => {
  const { codes } = req.body || {}
  if (!Array.isArray(codes)) return res.status(400).json({ error: '参数错误' })

  const isAdmin = req.user.role === 'admin'
  const allowed = []

  for (const code of codes) {
    const link = linkStore.getByCode(code)
    if (!link) continue
    if (isAdmin || link.creator === req.user.username) {
      allowed.push(code)
    }
  }

  const count = linkStore.batchRemove(allowed)
  res.json({ count })
})

router.post('/batch/status', (req, res) => {
  const { codes, status } = req.body || {}
  if (!Array.isArray(codes) || !['active', 'disabled'].includes(status)) {
    return res.status(400).json({ error: '参数错误' })
  }

  const isAdmin = req.user.role === 'admin'
  const allowed = []

  for (const code of codes) {
    const link = linkStore.getByCode(code)
    if (!link) continue
    if (isAdmin || link.creator === req.user.username) {
      allowed.push(code)
    }
  }

  const count = linkStore.batchUpdateStatus(allowed, status)
  res.json({ count })
})

export default router
