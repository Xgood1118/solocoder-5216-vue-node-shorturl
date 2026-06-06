<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon total">
            <el-icon><Link /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">总短链数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon active">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.active }}</div>
            <div class="stat-label">活跃短链</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon today">
            <el-icon><Plus /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayNew }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon click">
            <el-icon><Pointer /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayClicks }}</div>
            <div class="stat-label">今日点击</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="card-title">本周点击 TOP 10</span>
          </template>
          <el-table :data="topList" size="default">
            <el-table-column type="index" label="排名" width="60" align="center" />
            <el-table-column prop="code" label="短码" width="120" />
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
            <el-table-column prop="creator" label="创建人" width="100" />
            <el-table-column prop="clicks" label="点击数" width="100" align="right" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span class="card-title">快速创建短链</span>
          </template>
          <el-form :model="quickForm" label-width="80px">
            <el-form-item label="长链接">
              <el-input v-model="quickForm.url" placeholder="请输入 http:// 或 https:// 开头的链接" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="quickForm.remark" placeholder="可选，方便识别" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="creating" @click="handleCreate">
                立即生成
              </el-button>
            </el-form-item>
          </el-form>
          <div v-if="createdLink" class="created-result">
            <el-alert title="创建成功" type="success" :closable="false">
              <template #default>
                <div class="short-url-row">
                  <span class="short-url">{{ shortUrl }}</span>
                  <el-button size="small" type="primary" link @click="copyUrl">复制</el-button>
                </div>
              </template>
            </el-alert>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const stats = ref({
  total: 0,
  active: 0,
  todayNew: 0,
  todayClicks: 0,
  weekClicks: 0
})
const topList = ref([])
const quickForm = ref({
  url: '',
  remark: ''
})
const creating = ref(false)
const createdLink = ref(null)

const shortUrl = computed(() => {
  if (!createdLink.value) return ''
  return `${location.origin}/s/${createdLink.value.code}`
})

async function loadStats() {
  try {
    const res = await request.get('/api/stats/overview')
    stats.value = res
  } catch (e) {}
}

async function loadTop() {
  try {
    const res = await request.get('/api/stats/top10')
    topList.value = res.list
  } catch (e) {}
}

async function handleCreate() {
  if (!quickForm.value.url) {
    ElMessage.warning('请输入长链接')
    return
  }
  creating.value = true
  try {
    const res = await request.post('/api/links', quickForm.value)
    createdLink.value = res.link
    ElMessage.success('创建成功')
    loadStats()
    loadTop()
  } catch (e) {
  } finally {
    creating.value = false
  }
}

function copyUrl() {
  navigator.clipboard.writeText(shortUrl.value)
  ElMessage.success('已复制')
}

onMounted(() => {
  loadStats()
  loadTop()
})
</script>

<style scoped>
.stat-cards {
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  align-items: center;
  padding: 10px 0;
}
.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: #fff;
  margin-right: 16px;
}
.stat-icon.total { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.active { background: linear-gradient(135deg, #43cea2, #185a9d); }
.stat-icon.today { background: linear-gradient(135deg, #f6d365, #fda085); }
.stat-icon.click { background: linear-gradient(135deg, #fa709a, #fee140); }
.stat-info {
  flex: 1;
}
.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.card-title {
  font-size: 16px;
  font-weight: bold;
}
.created-result {
  margin-top: 16px;
}
.short-url-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
.short-url {
  font-family: monospace;
  color: #409eff;
  font-size: 14px;
}
</style>
