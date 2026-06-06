<template>
  <div class="share-page">
    <div class="share-container" v-loading="loading">
      <template v-if="error">
        <el-result icon="error" :title="error" sub-title="分享链接不存在或已过期" />
      </template>
      <template v-else-if="group">
        <div class="share-header">
          <h2>
            <el-icon><FolderOpened /></el-icon>
            {{ group.name }}
          </h2>
          <p class="share-path">{{ group.path }}</p>
          <el-tag type="info" size="small">
            分享链接有效期至 {{ formatDate(share.expiresAt) }}
          </el-tag>
        </div>

        <el-table :data="list" size="default" class="link-table">
          <el-table-column prop="code" label="短码" width="120">
            <template #default="{ row }">
              <span class="code-text">{{ row.code }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          <el-table-column prop="url" label="原始链接" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="url-text">{{ row.url }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="clicks" label="点击数" width="90" align="right" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="copyLink(row)">复制短链</el-button>
              <el-button size="small" type="success" link @click="openLink(row)" target="_blank">访问</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            background
            layout="total, prev, pager, next"
            :total="total"
            :page-size="pageSize"
            v-model:current-page="page"
            @current-change="loadLinks"
          />
        </div>

        <div class="share-footer">
          <el-divider />
          <p class="powered">企业短链服务 · 内部使用</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const route = useRoute()

const loading = ref(true)
const error = ref('')
const group = ref(null)
const share = ref(null)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

async function loadShareInfo() {
  loading.value = true
  error.value = ''
  try {
    const res = await request.get(`/api/share/link/${route.params.token}`)
    group.value = res.group
    share.value = res.share
    loadLinks()
  } catch (e) {
    error.value = e.response?.data?.error || '加载失败'
  } finally {
    loading.value = false
  }
}

async function loadLinks() {
  try {
    const res = await request.get(`/api/share/link/${route.params.token}/links`, {
      params: { page: page.value, pageSize: pageSize.value }
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
    error.value = e.response?.data?.error || '加载失败'
  }
}

function copyLink(row) {
  const url = `${location.origin}/s/${row.code}`
  navigator.clipboard.writeText(url)
  ElMessage.success('已复制短链')
}

function openLink(row) {
  const url = `/s/${row.code}`
  window.open(url, '_blank')
}

function formatDate(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => {
  loadShareInfo()
})
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 20px;
}
.share-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 800px;
  padding: 30px;
}
.share-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}
.share-header h2 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 8px;
  color: #303133;
  font-size: 24px;
}
.share-path {
  color: #909399;
  font-size: 14px;
  margin: 0 0 12px;
  font-family: monospace;
}
.link-table {
  margin-top: 16px;
}
.code-text {
  font-family: monospace;
  font-weight: bold;
  color: #409eff;
}
.url-text {
  color: #606266;
  font-size: 13px;
}
.pagination {
  margin-top: 20px;
  text-align: center;
}
.share-footer {
  margin-top: 30px;
}
.powered {
  text-align: center;
  color: #c0c4cc;
  font-size: 12px;
  margin: 0;
}
</style>
