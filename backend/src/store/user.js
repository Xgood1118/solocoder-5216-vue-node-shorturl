import { store } from './index.js'

const { users, genId } = store

users.set('admin', { id: 'u_admin', username: 'admin', password: 'admin123', role: 'admin' })
users.set('user1', { id: 'u_user1', username: 'user1', password: 'user123', role: 'user' })
users.set('user2', { id: 'u_user2', username: 'user2', password: 'user123', role: 'user' })

export const userStore = {
  findByUsername(username) {
    return users.get(username) || null
  },

  verify(username, password) {
    const user = users.get(username)
    if (!user) return null
    if (user.password !== password) return null
    return { id: user.id, username: user.username, role: user.role }
  },

  list() {
    return Array.from(users.values()).map(u => ({
      id: u.id,
      username: u.username,
      role: u.role
    }))
  }
}
