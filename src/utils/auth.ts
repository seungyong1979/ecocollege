import crypto from 'crypto'

// SHA-256 해시 (Node.js crypto)
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// 세션 토큰 생성
export function generateToken(username: string, secret: string): string {
  const payload = `${username}:${Date.now()}:${secret}`
  return Buffer.from(payload).toString('base64')
}

export function verifyToken(token: string, secret: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    if (parts.length < 3) return null
    const username = parts[0]
    const timestamp = parseInt(parts[1])
    const tokenSecret = parts.slice(2).join(':')
    // 24시간 유효
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return null
    if (tokenSecret !== secret) return null
    return username
  } catch {
    return null
  }
}

// 욕설 필터링
const BAD_WORDS = ['시발', '씨발', '개새', '병신', '지랄', '니미', '꺼져', '쓰레기']

export function filterBadWords(text: string): string {
  let result = text
  for (const word of BAD_WORDS) {
    result = result.replaceAll(word, '*'.repeat(word.length))
  }
  return result
}
