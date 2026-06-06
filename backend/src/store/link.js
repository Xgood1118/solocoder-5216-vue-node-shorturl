import { store } from './index.js'

const { links, logs, genId } = store

export const linkStore = {
  create(data) {
    const id = genId('l_')
    const now = Date.now()
    const link = {
      id,
      code: data.code,
      url: data.url,
      remark: data.remark || '',
      creator: data.creator,
      createdAt: now,
      expiresAt: data.neverExpires ? null : now + (data.expireDays || 30) * 86400000,
      neverExpires: data.neverExpires || false,
      clicks: 0,
      lastVisitedAt: null,
      status: 'active',
      groupId: data.groupId || null,
      password: data.password || null,
      abTest: data.abTest || null,
      abClicks: data.abTest ? { a: 0, b: 0 } : null
    }
    links.set(link.code, link)
    return link
  },

  getByCode(code) {
    return links.get(code) || null
  },

  getById(id) {
    for (const link of links.values()) {
      if (link.id === id) return link
    }
    return null
  },

  exists(code) {
    return links.has(code)
  },

  update(code, updates) {
    const link = links.get(code)
    if (!link) return null
    Object.assign(link, updates)
    return link
  },

  remove(code) {
    return links.delete(code)
  },

  list(filters = {}) {
    let result = Array.from(links.values())

    if (filters.creator) {
      result = result.filter(l => l.creator === filters.creator)
    }
    if (filters.status) {
      result = result.filter(l => l.status === filters.status)
    }
    if (filters.groupId) {
      result = result.filter(l => l.groupId === filters.groupId)
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(l =>
        l.code.toLowerCase().includes(kw) ||
        l.remark.toLowerCase().includes(kw) ||
        l.url.toLowerCase().includes(kw)
      )
    }
    if (filters.creatorKeyword) {
      const kw = filters.creatorKeyword.toLowerCase()
      result = result.filter(l => l.creator.toLowerCase().includes(kw))
    }

    result.sort((a, b) => b.createdAt - a.createdAt)
    return result
  },

  incrementClick(code, variant = null) {
    const link = links.get(code)
    if (!link) return
    link.clicks++
    link.lastVisitedAt = Date.now()
    if (variant && link.abClicks) {
      link.abClicks[variant]++
    }
  },

  batchRemove(codes) {
    let count = 0
    for (const code of codes) {
      if (links.delete(code)) count++
    }
    return count
  },

  batchUpdateStatus(codes, status) {
    let count = 0
    for (const code of codes) {
      const link = links.get(code)
      if (link) {
        link.status = status
        count++
      }
    }
    return count
  }
}
