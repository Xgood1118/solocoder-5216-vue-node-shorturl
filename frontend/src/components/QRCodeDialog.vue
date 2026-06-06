<template>
  <el-dialog :model-value="modelValue" title="二维码" width="400px" @update:model-value="$emit('update:modelValue', $event)">
    <div class="qr-container">
      <div class="qr-wrapper" ref="qrWrapper">
        <canvas ref="qrCanvas"></canvas>
        <img v-if="withLogo && logoUrl" class="qr-logo" :src="logoUrl" alt="logo" />
      </div>
      <div class="short-info">
        <p class="short-url">{{ shortUrl }}</p>
      </div>
    </div>
    <div class="qr-options">
      <el-form label-width="80px">
        <el-form-item label="尺寸">
          <el-radio-group v-model="size">
            <el-radio :label="128">小</el-radio>
            <el-radio :label="256">中</el-radio>
            <el-radio :label="512">大</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Logo">
          <el-switch v-model="withLogo" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="downloadPNG">下载 PNG</el-button>
      <el-button type="primary" @click="copyUrl">复制链接</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'

const props = defineProps({
  modelValue: Boolean,
  code: String
})

const emit = defineEmits(['update:modelValue'])

const qrCanvas = ref(null)
const size = ref(256)
const withLogo = ref(false)
const logoUrl = ref('')

const shortUrl = computed(() => {
  if (!props.code) return ''
  return `${location.origin}/s/${props.code}`
})

function generateQR() {
  if (!qrCanvas.value || !props.code) return
  QRCode.toCanvas(qrCanvas.value, shortUrl.value, {
    width: size.value,
    margin: 2,
    color: {
      dark: '#303133',
      light: '#ffffff'
    }
  }, (err) => {
    if (err) console.error(err)
  })
}

function downloadPNG() {
  if (!qrCanvas.value) return
  const link = document.createElement('a')
  link.download = `qrcode_${props.code}.png`
  
  if (withLogo.value) {
    const canvas = document.createElement('canvas')
    canvas.width = size.value
    canvas.height = size.value
    const ctx = canvas.getContext('2d')
    ctx.drawImage(qrCanvas.value, 0, 0)
    
    const logoSize = size.value * 0.2
    const x = (size.value - logoSize) / 2
    const y = (size.value - logoSize) / 2
    
    ctx.fillStyle = '#fff'
    ctx.fillRect(x - 4, y - 4, logoSize + 8, logoSize + 8)
    
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    logoImg.onload = () => {
      ctx.drawImage(logoImg, x, y, logoSize, logoSize)
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    logoImg.src = logoUrl.value
  } else {
    link.href = qrCanvas.value.toDataURL('image/png')
    link.click()
  }
  
  ElMessage.success('下载成功')
}

function copyUrl() {
  navigator.clipboard.writeText(shortUrl.value)
  ElMessage.success('已复制')
}

watch(() => props.modelValue, (val) => {
  if (val) {
    nextTick(() => {
      generateQR()
    })
  }
})

watch([size, () => props.code], () => {
  if (props.modelValue) {
    nextTick(generateQR)
  }
})

watch(withLogo, (val) => {
  if (val && !logoUrl.value) {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#409eff'
    ctx.fillRect(0, 0, 64, 64)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('短链', 32, 32)
    logoUrl.value = canvas.toDataURL('image/png')
  }
})
</script>

<style scoped>
.qr-container {
  text-align: center;
  padding: 20px 0;
}
.qr-wrapper {
  display: inline-block;
  position: relative;
  padding: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}
.qr-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20%;
  height: 20%;
  background: #fff;
  padding: 4px;
  border-radius: 6px;
}
.short-info {
  margin-top: 16px;
}
.short-url {
  font-family: monospace;
  font-size: 14px;
  color: #409eff;
  word-break: break-all;
}
.qr-options {
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}
</style>
