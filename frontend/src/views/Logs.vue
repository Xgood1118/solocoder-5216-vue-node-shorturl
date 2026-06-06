<template>
  <div class="logs-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="短码">
          <el-input v-model="filters.code" placeholder="请输入短码" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="IP">
          <el-input v-model="filters.ip" placeholder="请输入 IP" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLogs">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <span>访问日志</span>
      </template>
      <el-table :data="list" v-loading="loading" size="default">
        <el-table-column prop="code" label="短码" width="100" />
        <el-table-column prop="ip" label="来源 IP" width="150" />
        <el-table-column prop="userAgent" label="User-Agent" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="ua-text">{{ row.userAgent || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timestamp" label="访问时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.timestamp) }}
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[20, 50, 100, 200]"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          @size-change="loadLogs"
          @current-change="loadLogs"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '../utils/request'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref([])

const filters = reactive({
  code: '',
  ip: ''
})

function formatDate(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

async function loadLogs() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      code: filters.code || undefined,
      ip: filters.ip || undefined
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0].getTime()
      params.endTime = dateRange.value[1].getTime()
    }
    const res = await request.get('/api/logs', { params })
    list.value = res.list
    total.value = res.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.code = ''
  filters.ip = ''
  dateRange.value = []
  page.value = 1
  loadLogs()
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.filter-card {
  margin-bottom: 20px;
}
.ua-text {
  font-size: 12px;
  color: #606266;
}
.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
