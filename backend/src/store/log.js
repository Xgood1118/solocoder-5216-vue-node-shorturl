import { store } from './index.js'

const { logs } = store

export const logStore = {
  add(entry) {
    logs.push({
      ...entry,
      id: store.genId('log_'),
      timestamp: Date.now()
    })
  },

  list(filters = {}) {
    let result = [...logs]

    if (filters.code) {
      result = result.filter(l => l.code === filters.code)
    }
    if (filters.ip) {
      result = result.filter(l => l.ip === filters.ip)
    }
    if (filters.startTime) {
      result = result.filter(l => l.timestamp >= filters.startTime)
    }
    if (filters.endTime) {
      result = result.filter(l => l.timestamp <= filters.endTime)
    }

    result.sort((a, b) => b.timestamp - a.timestamp)
    return result
  },

  cleanOld(days = 7) {
    const cutoff = Date.now() - days * 86400000
    const before = logs.length
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].timestamp < cutoff) {
        logs.splice(i, 1)
      }
    }
    return before - logs.length
  }
}
