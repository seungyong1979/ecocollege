// SHA-256 해시 (Web Crypto API 사용 - Cloudflare Workers 지원)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashed = await hashPassword(password)
  return hashed === hash
}

// JWT 없이 간단한 세션 토큰 생성 (Cloudflare 환경용)
export function generateToken(username: string, secret: string): string {
  const payload = `${username}:${Date.now()}:${secret}`
  return btoa(payload)
}

export function verifyToken(token: string, secret: string): string | null {
  try {
    const decoded = atob(token)
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

// 욕설 필터링 (기본 목록)
const BAD_WORDS = ['시발', '씨발', '개새', '병신', '지랄', '니미', '꺼져', '쓰레기', '바보', '멍청']

export function filterBadWords(text: string): { filtered: boolean; text: string } {
  let result = text
  let filtered = false
  for (const word of BAD_WORDS) {
    if (result.includes(word)) {
      result = result.replaceAll(word, '*'.repeat(word.length))
      filtered = true
    }
  }
  return { filtered, text: result }
}

// 전화번호 마스킹
export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}
