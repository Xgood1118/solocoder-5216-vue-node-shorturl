import { defineStore } from 'pinia'
import request from '../utils/request'
import router from '../router'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || ''
  }),
  getters: {
    isLoggedIn: state => !!state.token,
    isAdmin: state => state.user?.role === 'admin'
  },
  actions: {
    async login(username, password) {
      const res = await request.post('/api/auth/login', { username, password })
      this.token = res.token
      this.user = res.user
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      return res
    },
    async logout() {
      try {
        await request.post('/api/auth/logout')
      } catch (e) {
        // ignore
      }
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }
})
