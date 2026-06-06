import { store } from './index.js'

const { groups, genId } = store

function buildPath(parentPath, name) {
  const cleanName = name.replace(/\//g, '')
  return parentPath ? `${parentPath}/${cleanName}` : `/${cleanName}`
}

function updateChildrenPaths(parentId, oldParentPath, newParentPath) {
  for (const group of groups.values()) {
    if (group.parentId === parentId) {
      const oldPath = group.path
      const relativePath = oldPath.slice(oldParentPath.length)
      const newPath = newParentPath + relativePath
      group.path = newPath
      updateChildrenPaths(group.id, oldPath, newPath)
    }
  }
}

export const groupStore = {
  create(data) {
    const id = genId('g_')
    const now = Date.now()

    let parentPath = ''
    if (data.parentId) {
      const parent = groups.get(data.parentId)
      if (!parent) throw new Error('父分组不存在')
      parentPath = parent.path
    }

    const path = buildPath(parentPath, data.name)

    const group = {
      id,
      name: data.name,
      parentId: data.parentId || null,
      path,
      creator: data.creator,
      createdAt: now,
      sharedUsers: []
    }
    groups.set(id, group)
    return group
  },

  getById(id) {
    return groups.get(id) || null
  },

  listByCreator(creator) {
    return Array.from(groups.values())
      .filter(g => g.creator === creator)
      .sort((a, b) => a.path.localeCompare(b.path))
  },

  listSharedWithUser(username) {
    return Array.from(groups.values())
      .filter(g => g.sharedUsers && g.sharedUsers.includes(username))
      .sort((a, b) => a.path.localeCompare(b.path))
  },

  rename(id, newName) {
    const group = groups.get(id)
    if (!group) throw new Error('分组不存在')

    const oldPath = group.path
    const parentPath = group.parentId
      ? (groups.get(group.parentId)?.path || '')
      : ''

    const newPath = buildPath(parentPath, newName)
    group.name = newName

    updateChildrenPaths(id, oldPath, newPath)
    group.path = newPath

    return group
  },

  remove(id) {
    const group = groups.get(id)
    if (!group) return false

    const childIds = []
    for (const g of groups.values()) {
      if (g.parentId === id) childIds.push(g.id)
    }
    for (const cid of childIds) {
      this.remove(cid)
    }

    return groups.delete(id)
  },

  share(id, username) {
    const group = groups.get(id)
    if (!group) throw new Error('分组不存在')
    if (!group.sharedUsers.includes(username)) {
      group.sharedUsers.push(username)
    }
    return group
  },

  unshare(id, username) {
    const group = groups.get(id)
    if (!group) throw new Error('分组不存在')
    group.sharedUsers = group.sharedUsers.filter(u => u !== username)
    return group
  },

  getTree(creator) {
    const all = this.listByCreator(creator)
    const map = new Map()
    const roots = []

    for (const g of all) {
      map.set(g.id, { ...g, children: [] })
    }
    for (const g of map.values()) {
      if (g.parentId && map.has(g.parentId)) {
        map.get(g.parentId).children.push(g)
      } else if (!g.parentId) {
        roots.push(g)
      }
    }

    return roots
  }
}
