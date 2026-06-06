<template>
  <div class="links-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="短码/备注/URL" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="创建人">
          <el-input v-model="filters.creatorKeyword" placeholder="创建人关键字" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="filters.groupId" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="g in groups" :key="g.id" :label="g.path" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLinks">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="list-card">
      <template #header>
        <div class="card-header">
          <span>短链列表</span>
          <div>
            <el-button v-if="selected.length > 0" type="warning" size="small" @click="handleBatchEnable">
              批量启用 ({{ selected.length }})
            </el-button>
            <el-button v-if="selected.length > 0" type="info" size="small" @click="handleBatchDisable">
              批量禁用 ({{ selected.length }})
            </el-button>
            <el-button v-if="selected.length > 0" type="danger" size="small" @click="handleBatchDelete">
              批量删除 ({{ selected.length }})
            </el-button>
            <el-button type="primary" size="small" @click="showCreateDialog = true">
              <el-icon><Plus /></el-icon>
              新建短链
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" @selection-change="handleSelectionChange" v-loading="loading">
        <el-table-column type="selection" width="55" />
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
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="clicks" label="点击数" width="90" align="right" sortable />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row)" size="small">{{ statusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="copyLink(row)">复制</el-button>
            <el-button size="small" type="success" link @click="showQRCode(row)">二维码</el-button>
            <el-button size="small" type="warning" link @click="editLink(row)">编辑</el-button>
            <el-button v-if="row.status === 'active'" size="small" type="info" link @click="toggleStatus(row)">禁用</el-button>
            <el-button v-else size="small" type="success" link @click="toggleStatus(row)">启用</el-button>
            <el-button size="small" type="danger" link @click="deleteLink(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          @size-change="loadLinks"
          @current-change="loadLinks"
        />
      </div>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="新建短链" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="长链接 *">
          <el-input v-model="createForm.url" placeholder="http:// 或 https:// 开头" />
        </el-form-item>
        <el-form-item label="自定义短码">
          <el-input v-model="createForm.customCode" placeholder="4-20位字母数字下划线，可选" />
          <div class="form-tip">留空则系统自动生成6位短码</div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" placeholder="可选，方便识别" />
        </el-form-item>
        <el-form-item label="所属分组">
          <el-select v-model="createForm.groupId" placeholder="不分组" clearable style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.path" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="过期时间">
          <el-radio-group v-model="createForm.neverExpires">
            <el-radio :label="false">30天后过期</el-radio>
            <el-radio :label="true">永不过期</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="访问密码">
          <el-input v-model="createForm.password" placeholder="可选，设置后访问需要密码" show-password />
        </el-form-item>
        <el-form-item label="AB 测试">
          <el-switch v-model="createForm.abTest.enabled" />
        </el-form-item>
        <template v-if="createForm.abTest.enabled">
          <el-form-item label="A 链接">
            <el-input v-model="createForm.abTest.urlA" placeholder="https://..." />
          </el-form-item>
          <el-form-item label="B 链接">
            <el-input v-model="createForm.abTest.urlB" placeholder="https://..." />
          </el-form-item>
          <el-form-item label="流量分配">
            <el-slider v-model="createForm.abTest.weightA" :min="10" :max="90" />
            <div class="form-tip">A: {{ createForm.abTest.weightA }}% / B: {{ 100 - createForm.abTest.weightA }}%</div>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEditDialog" title="编辑短链" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="短码">
          <span class="code-text">{{ editForm.code }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" />
        </el-form-item>
        <el-form-item label="所属分组">
          <el-select v-model="editForm.groupId" placeholder="不分组" clearable style="width: 100%">
            <el-option v-for="g in groups" :key="g.id" :label="g.path" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="访问密码">
          <el-input v-model="editForm.password" placeholder="留空则不设密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="handleEdit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDeleteDialog" title="删除确认" width="400px">
      <p>确定要删除该短链吗？删除后无法恢复。</p>
      <p style="margin: 12px 0;">请输入短码 <strong>{{ deletingCode }}</strong> 确认：</p>
      <el-input v-model="deleteConfirm" placeholder="请输入短码确认" />
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" :disabled="deleteConfirm !== deletingCode" @click="confirmDelete">确认删除</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showBatchDeleteDialog" title="批量删除确认" width="500px">
      <p>确定要删除选中的 {{ selected.length }} 条短链吗？删除后无法恢复。</p>
      <p style="margin: 12px 0;">请输入 <strong>DELETE</strong> 确认：</p>
      <el-input v-model="batchDeleteConfirm" placeholder="请输入 DELETE" />
      <template #footer>
        <el-button @click="showBatchDeleteDialog = false">取消</el-button>
        <el-button type="danger" :disabled="batchDeleteConfirm !== 'DELETE'" @click="confirmBatchDelete">确认删除</el-button>
      </template>
    </el-dialog>

    <qr-code-dialog v-model="showQRDialog" :code="currentCode" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import QRCodeDialog from '../components/QRCodeDialog.vue'

const list = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const groups = ref([])
const selected = ref([])

const filters = reactive({
  keyword: '',
  status: '',
  groupId: '',
  creatorKeyword: ''
})

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const showBatchDeleteDialog = ref(false)
const showQRDialog = ref(false)
const creating = ref(false)
const editing = ref(false)
const deletingCode = ref('')
const deleteConfirm = ref('')
const batchDeleteConfirm = ref('')
const currentCode = ref('')

const createForm = reactive({
  url: '',
  customCode: '',
  remark: '',
  groupId: '',
  neverExpires: false,
  expireDays: 30,
  password: '',
  abTest: {
    enabled: false,
    urlA: '',
    urlB: '',
    weightA: 50
  }
})

const editForm = reactive({
  id: '',
  code: '',
  remark: '',
  groupId: '',
  password: ''
})

function statusText(row) {
  if (row.status === 'disabled') return '禁用'
  if (row.neverExpires) return '启用'
  if (row.expiresAt && Date.now() > row.expiresAt) return '已过期'
  return '启用'
}

function statusTagType(row) {
  if (row.status === 'disabled') return 'info'
  if (row.neverExpires) return 'success'
  if (row.expiresAt && Date.now() > row.expiresAt) return 'warning'
  return 'success'
}

function formatDate(ts) {
  if (!ts) return '-'
  const d = new Date(ts)
  return d.toLocaleString('zh-CN', { hour12: false })
}

async function loadLinks() {
  loading.value = true
  try {
    const res = await request.get('/api/links', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword || undefined,
        status: filters.status || undefined,
        groupId: filters.groupId || undefined,
        creatorKeyword: filters.creatorKeyword || undefined
      }
    })
    list.value = res.list
    total.value = res.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

async function loadGroups() {
  try {
    const res = await request.get('/api/groups')
    groups.value = res.groups
  } catch (e) {}
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.groupId = ''
  filters.creatorKeyword = ''
  page.value = 1
  loadLinks()
}

function handleSelectionChange(val) {
  selected.value = val
}

function copyLink(row) {
  const url = `${location.origin}/s/${row.code}`
  navigator.clipboard.writeText(url)
  ElMessage.success('已复制短链')
}

function showQRCode(row) {
  currentCode.value = row.code
  showQRDialog.value = true
}

function editLink(row) {
  editForm.id = row.id
  editForm.code = row.code
  editForm.remark = row.remark
  editForm.groupId = row.groupId
  editForm.password = row.password || ''
  showEditDialog.value = true
}

async function handleCreate() {
  if (!createForm.url) {
    ElMessage.warning('请输入长链接')
    return
  }
  creating.value = true
  try {
    const payload = {
      url: createForm.url,
      customCode: createForm.customCode || undefined,
      remark: createForm.remark,
      groupId: createForm.groupId || undefined,
      neverExpires: createForm.neverExpires,
      expireDays: createForm.neverExpires ? undefined : 30,
      password: createForm.password || undefined,
      abTest: createForm.abTest.enabled ? {
        enabled: true,
        urlA: createForm.abTest.urlA,
        urlB: createForm.abTest.urlB,
        weightA: createForm.abTest.weightA
      } : undefined
    }
    await request.post('/api/links', payload)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    resetCreateForm()
    loadLinks()
  } catch (e) {
  } finally {
    creating.value = false
  }
}

function resetCreateForm() {
  createForm.url = ''
  createForm.customCode = ''
  createForm.remark = ''
  createForm.groupId = ''
  createForm.neverExpires = false
  createForm.password = ''
  createForm.abTest = {
    enabled: false,
    urlA: '',
    urlB: '',
    weightA: 50
  }
}

async function handleEdit() {
  editing.value = true
  try {
    await request.put(`/api/links/${editForm.code}`, {
      remark: editForm.remark,
      groupId: editForm.groupId || null,
      password: editForm.password || null
    })
    ElMessage.success('保存成功')
    showEditDialog.value = false
    loadLinks()
  } catch (e) {
  } finally {
    editing.value = false
  }
}

async function toggleStatus(row) {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  try {
    await request.put(`/api/links/${row.code}`, { status: newStatus })
    ElMessage.success('操作成功')
    loadLinks()
  } catch (e) {}
}

function deleteLink(row) {
  deletingCode.value = row.code
  deleteConfirm.value = ''
  showDeleteDialog.value = true
}

async function confirmDelete() {
  try {
    await request.delete(`/api/links/${deletingCode.value}`)
    ElMessage.success('删除成功')
    showDeleteDialog.value = false
    loadLinks()
  } catch (e) {}
}

async function handleBatchEnable() {
  if (selected.value.length === 0) return
  const codes = selected.value.map(s => s.code)
  try {
    await request.post('/api/links/batch/status', { codes, status: 'active' })
    ElMessage.success('批量启用成功')
    loadLinks()
    selected.value = []
  } catch (e) {}
}

async function handleBatchDisable() {
  if (selected.value.length === 0) return
  const codes = selected.value.map(s => s.code)
  try {
    await request.post('/api/links/batch/status', { codes, status: 'disabled' })
    ElMessage.success('批量禁用成功')
    loadLinks()
    selected.value = []
  } catch (e) {}
}

function handleBatchDelete() {
  if (selected.value.length === 0) return
  batchDeleteConfirm.value = ''
  showBatchDeleteDialog.value = true
}

async function confirmBatchDelete() {
  const codes = selected.value.map(s => s.code)
  try {
    await request.post('/api/links/batch/delete', { codes })
    ElMessage.success('批量删除成功')
    showBatchDeleteDialog.value = false
    loadLinks()
    selected.value = []
  } catch (e) {}
}

onMounted(() => {
  loadLinks()
  loadGroups()
})
</script>

<style scoped>
.filter-card {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  text-align: right;
}
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
