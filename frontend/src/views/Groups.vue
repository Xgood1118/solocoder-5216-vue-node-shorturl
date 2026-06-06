<template>
  <div class="groups-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>我的分组</span>
              <el-button size="small" type="primary" @click="showCreateDialog = true">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </template>
          <el-tree
            :data="treeData"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            :expand-on-click-node="false"
            v-model:current-node-key="currentGroupId"
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <span class="tree-node">
                <el-icon><Folder /></el-icon>
                <span class="node-name">{{ data.name }}</span>
              </span>
            </template>
          </el-tree>

          <div style="margin-top: 20px;">
            <el-divider>分享给我的</el-divider>
            <div v-if="sharedGroups.length === 0" class="empty-tip">暂无</div>
            <div v-for="g in sharedGroups" :key="g.id"
                 class="shared-item"
                 :class="{ active: currentGroupId === g.id }"
                 @click="selectSharedGroup(g)">
              <el-icon><Share /></el-icon>
              <span class="shared-name">{{ g.path }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ currentGroup?.name || '分组详情' }}</span>
              <div v-if="currentGroup && isOwner">
                <el-button size="small" @click="handleRename">重命名</el-button>
                <el-button size="small" type="success" @click="showShareDialog = true">
                  <el-icon><Share /></el-icon>
                  分享
                </el-button>
                <el-button size="small" type="danger" @click="handleDelete">删除</el-button>
              </div>
            </div>
          </template>

          <div v-if="!currentGroup" class="empty-state">
            <el-empty description="请选择一个分组" />
          </div>

          <div v-else>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="路径">{{ currentGroup.path }}</el-descriptions-item>
              <el-descriptions-item label="创建人">{{ currentGroup.creator }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(currentGroup.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="分享给">
                <template v-if="currentGroup.sharedUsers?.length">
                  <el-tag v-for="u in currentGroup.sharedUsers" :key="u" size="small" style="margin-right: 4px;">
                    {{ u }}
                  </el-tag>
                </template>
                <span v-else>-</span>
              </el-descriptions-item>
            </el-descriptions>

            <div style="margin-top: 24px;">
              <h4 style="margin-bottom: 12px;">分享链接</h4>
              <el-button size="small" type="primary" @click="showShareLinkDialog = true">
                生成分享链接
              </el-button>
              <div style="margin-top: 12px;">
                <div v-for="s in shareLinks" :key="s.token" class="share-link-item">
                  <span class="share-token">{{ s.token.slice(0, 16) }}...</span>
                  <span class="share-expire">有效期：{{ s.expireHours }}h</span>
                  <el-button size="small" link type="danger" @click="revokeShare(s.token)">撤销</el-button>
                </div>
                <div v-if="shareLinks.length === 0" class="empty-tip">暂无分享链接</div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px;" v-if="currentGroup">
          <template #header>
            <span>该分组下的短链</span>
          </template>
          <el-table :data="groupLinks" v-loading="loadingLinks" size="small">
            <el-table-column prop="code" label="短码" width="100" />
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
            <el-table-column prop="creator" label="创建人" width="100" />
            <el-table-column prop="clicks" label="点击" width="80" align="right" />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                  {{ row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="showCreateDialog" title="新建分组" width="400px">
      <el-form label-width="80px">
        <el-form-item label="父分组">
          <el-select v-model="createForm.parentId" placeholder="根级分组" clearable style="width: 100%">
            <el-option v-for="g in flatGroups" :key="g.id" :label="g.path" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分组名">
          <el-input v-model="createForm.name" placeholder="请输入分组名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showShareDialog" title="分享分组" width="400px">
      <el-form label-width="80px">
        <el-form-item label="添加用户">
          <el-select v-model="shareUser" placeholder="选择用户" filterable style="width: 100%">
            <el-option v-for="u in allUsers" :key="u.username" :label="u.username" :value="u.username" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addShareUser">添加</el-button>
        </el-form-item>
      </el-form>
      <div>
        <div class="share-list-title">已分享用户：</div>
        <div class="share-user-list">
          <el-tag v-for="u in currentGroup?.sharedUsers || []" :key="u" closable @close="removeShareUser(u)">
            {{ u }}
          </el-tag>
          <span v-if="!currentGroup?.sharedUsers?.length" class="empty-tip">暂无</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showShareDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showShareLinkDialog" title="生成分享链接" width="400px">
      <el-form label-width="80px">
        <el-form-item label="有效期">
          <el-radio-group v-model="shareLinkHours">
            <el-radio :label="1">1 小时</el-radio>
            <el-radio :label="24">24 小时</el-radio>
            <el-radio :label="168">7 天</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showShareLinkDialog = false">取消</el-button>
        <el-button type="primary" @click="createShareLink">生成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showRenameDialog" title="重命名分组" width="400px">
      <el-form label-width="80px">
        <el-form-item label="新名称">
          <el-input v-model="renameName" placeholder="请输入新名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" :loading="renaming" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()

const treeData = ref([])
const sharedGroups = ref([])
const currentGroupId = ref('')
const currentGroup = ref(null)
const groupLinks = ref([])
const loadingLinks = ref(false)
const allUsers = ref([])
const shareLinks = ref([])

const showCreateDialog = ref(false)
const showShareDialog = ref(false)
const showShareLinkDialog = ref(false)
const showRenameDialog = ref(false)
const creating = ref(false)
const renaming = ref(false)
const shareUser = ref('')
const shareLinkHours = ref(24)
const renameName = ref('')

const createForm = reactive({
  name: '',
  parentId: ''
})

const flatGroups = computed(() => {
  function flatten(nodes) {
    let result = []
    for (const n of nodes) {
      result.push(n)
      if (n.children) {
        result = result.concat(flatten(n.children))
      }
    }
    return result
  }
  return flatten(treeData.value)
})

const isOwner = computed(() => {
  if (!currentGroup.value) return false
  return currentGroup.value.creator === userStore.user?.username || userStore.isAdmin
})

async function loadTree() {
  try {
    const res = await request.get('/api/groups/tree')
    treeData.value = res.tree
  } catch (e) {}
}

async function loadShared() {
  try {
    const res = await request.get('/api/groups/shared')
    sharedGroups.value = res.groups
  } catch (e) {}
}

async function loadUsers() {
  try {
    const res = await request.get('/api/auth/users')
    allUsers.value = res.users
  } catch (e) {}
}

function handleNodeClick(data) {
  currentGroupId.value = data.id
  loadGroupDetail(data.id)
}

function selectSharedGroup(g) {
  currentGroupId.value = g.id
  loadGroupDetail(g.id)
}

async function loadGroupDetail(id) {
  try {
    const res = await request.get(`/api/groups/${id}`)
    currentGroup.value = res.group
    loadGroupLinks(id)
    loadShareLinks(id)
  } catch (e) {}
}

async function loadGroupLinks(groupId) {
  loadingLinks.value = true
  try {
    const res = await request.get('/api/links', { params: { groupId, pageSize: 100 } })
    groupLinks.value = res.list
  } catch (e) {
  } finally {
    loadingLinks.value = false
  }
}

async function loadShareLinks(groupId) {
  try {
    const res = await request.get(`/api/share/group/${groupId}/links`)
    shareLinks.value = res.shares
  } catch (e) {}
}

async function handleCreate() {
  if (!createForm.name) {
    ElMessage.warning('请输入分组名')
    return
  }
  creating.value = true
  try {
    await request.post('/api/groups', {
      name: createForm.name,
      parentId: createForm.parentId || null
    })
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    createForm.name = ''
    createForm.parentId = ''
    loadTree()
  } catch (e) {
  } finally {
    creating.value = false
  }
}

function handleRename() {
  renameName.value = currentGroup.value?.name || ''
  showRenameDialog.value = true
}

async function confirmRename() {
  if (!renameName.value) {
    ElMessage.warning('请输入新名称')
    return
  }
  renaming.value = true
  try {
    await request.put(`/api/groups/${currentGroupId.value}/rename`, { name: renameName.value })
    ElMessage.success('重命名成功')
    showRenameDialog.value = false
    loadTree()
    loadGroupDetail(currentGroupId.value)
  } catch (e) {
  } finally {
    renaming.value = false
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定要删除该分组吗？子分组也会被删除。', '删除确认', {
      type: 'warning'
    })
    await request.delete(`/api/groups/${currentGroupId.value}`)
    ElMessage.success('删除成功')
    currentGroupId.value = ''
    currentGroup.value = null
    loadTree()
  } catch (e) {
    if (e !== 'cancel') {}
  }
}

async function addShareUser() {
  if (!shareUser.value) return
  try {
    await request.post(`/api/share/group/${currentGroupId.value}/users`, { username: shareUser.value })
    ElMessage.success('添加成功')
    shareUser.value = ''
    loadGroupDetail(currentGroupId.value)
  } catch (e) {}
}

async function removeShareUser(username) {
  try {
    await request.delete(`/api/share/group/${currentGroupId.value}/users/${username}`)
    ElMessage.success('移除成功')
    loadGroupDetail(currentGroupId.value)
  } catch (e) {}
}

async function createShareLink() {
  try {
    await request.post(`/api/share/group/${currentGroupId.value}/link`, { expireHours: shareLinkHours.value })
    ElMessage.success('生成成功')
    showShareLinkDialog.value = false
    loadShareLinks(currentGroupId.value)
  } catch (e) {}
}

async function revokeShare(token) {
  try {
    await request.delete(`/api/share/link/${token}`)
    ElMessage.success('已撤销')
    loadShareLinks(currentGroupId.value)
  } catch (e) {}
}

function formatDate(ts) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => {
  loadTree()
  loadShared()
  loadUsers()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
}
.node-name {
  font-size: 14px;
}
.empty-state {
  padding: 40px 0;
}
.empty-tip {
  color: #c0c4cc;
  font-size: 13px;
}
.shared-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.shared-item:hover {
  background: #f5f7fa;
}
.shared-item.active {
  background: #ecf5ff;
  color: #409eff;
}
.shared-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.share-link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
}
.share-token {
  font-family: monospace;
  font-size: 13px;
}
.share-expire {
  color: #909399;
  font-size: 12px;
}
.share-list-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}
.share-user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
