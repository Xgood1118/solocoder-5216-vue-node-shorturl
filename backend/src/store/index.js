const links = new Map()
const groups = new Map()
const logs = []
const users = new Map()
const shareTokens = new Map()
const groupShares = new Map()

function genId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const store = {
  links,
  groups,
  logs,
  users,
  shareTokens,
  groupShares,
  genId
}
