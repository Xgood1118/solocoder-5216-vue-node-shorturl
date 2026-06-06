import crypto from 'node:crypto'

export function generateShortCode(existsFn, length = 6, maxRetries = 3) {
  let currentLength = length
  let retries = 0

  while (retries < maxRetries) {
    const bytes = Math.ceil((currentLength * 6) / 8)
    const code = crypto.randomBytes(bytes).toString('base64url').slice(0, currentLength)

    if (!existsFn(code)) {
      return code
    }

    retries++
    if (retries < maxRetries) {
      currentLength++
    }
  }

  throw new Error('Failed to generate unique short code after max retries')
}

export function validateCustomCode(code) {
  if (typeof code !== 'string') return false
  if (code.length < 4 || code.length > 20) return false
  if (!/^[a-zA-Z0-9_]+$/.test(code)) return false

  const reserved = ['admin', 'api', 'login', 'register', 's', 'static', 'favicon.ico']
  if (reserved.includes(code.toLowerCase())) return false

  return true
}
