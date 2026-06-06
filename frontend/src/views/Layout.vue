<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">短链服务</div>
      <el-menu :default-active="activeMenu" router class="menu">
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/links">
          <el-icon><Link /></el-icon>
          <span>短链管理</span>
        </el-menu-item>
        <el-menu-item index="/groups">
          <el-icon><Folder /></el-icon>
          <span>分组管理</span>
        </el-menu-item>
        <el-menu-item v-if="isAdmin" index="/logs">
          <el-icon><Document /></el-icon>
          <span>访问日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="welcome">欢迎，{{ user?.username || '' }}</span>
          <el-tag v-if="isAdmin" type="danger" size="small">管理员</el-tag>
        </div>
        <div class="header-right">
          <el-button text @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const userStore = useUserStore()

const user = computed(() => userStore.user)
const isAdmin = computed(() => userStore.isAdmin)
const activeMenu = computed(() => route.path)

function handleLogout() {
  userStore.logout()
}
</script>

<style scoped>
.layout {
  height: 100vh;
}
.aside {
  background: #001529;
  color: #fff;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  border-bottom: 1px solid #1f3a55;
}
.menu {
  border: none;
  background: transparent;
}
.menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.8);
}
.menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.menu :deep(.el-menu-item.is-active) {
  background: #409eff;
  color: #fff;
}
.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.welcome {
  font-size: 16px;
  color: #303133;
}
.main {
  background: #f5f7fa;
  padding: 20px;
  overflow: auto;
}
</style>
