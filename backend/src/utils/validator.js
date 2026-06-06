import { URL } from 'node:url'
import { isPrivate } from './ip.js'

const MALICIOUS_DOMAINS = new Set([
  'evil.com',
  'malware.com',
  'phishing.com',
  'spam.com',
  'scam.com'
])

export function validateUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') {
    return { valid: false, message: 'URL 不能为空' }
  }

  if (urlStr.length > 2048) {
    return { valid: false, message: 'URL 长度不能超过 2048 字符' }
  }

  if (!/^https?:\/\//i.test(urlStr)) {
    return { valid: false, message: 'URL 必须以 http:// 或 https:// 开头' }
  }

  let parsed
  try {
    parsed = new URL(urlStr)
  } catch (e) {
    return { valid: false, message: 'URL 格式不正确' }
  }

  const hostname = parsed.hostname.toLowerCase()

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return { valid: false, message: '不允许使用 localhost 或本地回环地址' }
  }

  if (isPrivate(hostname)) {
    return { valid: false, message: '不允许使用内网 IP 地址' }
  }

  if (MALICIOUS_DOMAINS.has(hostname)) {
    return { valid: false, message: '该域名在黑名单中' }
  }

  return { valid: true }
}
