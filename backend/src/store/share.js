import { store } from './index.js'
import crypto from 'node:crypto'

const { groupShares, genId } = store

export const shareStore = {
  createShareLink(groupId, expireHours) {
    const token = crypto.randomBytes(16).toString('hex')
    const now = Date.now()
    const expiresAt = now + expireHours * 3600000

    const share = {
      token,
      groupId,
      createdAt: now,
      expiresAt,
      expireHours
    }
    groupShares.set(token, share)
    return share
  },

  getByToken(token) {
    const share = groupShares.get(token)
    if (!share) return null
    if (Date.now() > share.expiresAt) {
      groupShares.delete(token)
      return null
    }
    return share
  },

  listByGroup(groupId) {
    return Array.from(groupShares.values())
      .filter(s => s.groupId === groupId)
      .sort((a, b) => b.createdAt - a.createdAt)
  },

  revoke(token) {
    return groupShares.delete(token)
  }
}
