import { Hono } from 'hono'
import { filterBadWords } from '../utils/auth'

type Bindings = { DB: D1Database; ADMIN_SECRET: string }

export const apiRoutes = new Hono<{ Bindings: Bindings }>()

// 의제 목록 조회 (공개 - visible만)
apiRoutes.get('/agendas', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, content, district, created_at FROM agendas WHERE status = 'visible' ORDER BY created_at DESC LIMIT 50`
    ).all()
    return c.json({ success: true, data: results })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 단어 빈도 조회 (워드 클라우드용)
apiRoutes.get('/word-cloud', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT content FROM agendas WHERE status = 'visible' ORDER BY created_at DESC LIMIT 200`
    ).all()

    const wordCount: Record<string, number> = {}
    const stopWords = new Set(['이', '가', '을', '를', '은', '는', '의', '에', '에서', '로', '으로', '와', '과', '도', '만', '이다', '있다', '하다', '그', '저', '이런', '저런', '있는', '없는', '너무', '정말', '매우', '좀', '더', '이제', '그냥', '거의', '아직', '이미', '그리고', '하지만', '또한', '또는', '그래서', '만약', '때문에', '위해', '위한', '하여', '않는', '않고', '않아', '없이', '있어', '해서', '해야', '해주', '주세요', '해주세요', '시켜', '시켜주세요', '부탁', '바랍니다', '합니다', '합시다', '해요', '이요', '예요', '어요', '아요'])

    for (const row of results) {
      const text = (row as any).content as string
      // 공백·특수문자로 분리, 2글자 이상인 단어만
      const words = text.split(/[\s,!?.·。、，！？\-\(\)\[\]「」『』【】]+/).filter(w => {
        const clean = w.trim()
        return clean.length >= 2 && !stopWords.has(clean)
      })
      for (const word of words) {
        wordCount[word] = (wordCount[word] || 0) + 1
      }
    }

    const sorted = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60)
      .map(([word, count]) => ({ word, count }))

    return c.json({ success: true, data: sorted })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 사이트 설정 조회
apiRoutes.get('/settings', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT key, value FROM site_settings`
    ).all()
    const settings: Record<string, string> = {}
    for (const row of results) {
      settings[(row as any).key] = (row as any).value
    }
    return c.json({ success: true, data: settings })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 의제 등록
apiRoutes.post('/agendas', async (c) => {
  try {
    const body = await c.req.json()
    const { content, name, phone, email, district, privacy_agreed } = body

    // 필수값 검증
    if (!content?.trim()) return c.json({ success: false, error: '의제 내용을 입력해 주세요.' }, 400)
    if (!name?.trim()) return c.json({ success: false, error: '이름을 입력해 주세요.' }, 400)
    if (!phone?.trim()) return c.json({ success: false, error: '연락처를 입력해 주세요.' }, 400)
    if (!district?.trim()) return c.json({ success: false, error: '거주 동을 입력해 주세요.' }, 400)
    if (!privacy_agreed) return c.json({ success: false, error: '개인정보 활용에 동의해 주세요.' }, 400)

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return c.json({ success: false, error: '올바른 전화번호 형식을 입력해 주세요.' }, 400)
    }

    // 이메일 형식 검증 (옵션)
    if (email && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return c.json({ success: false, error: '올바른 이메일 형식을 입력해 주세요.' }, 400)
      }
    }

    // 욕설 필터링
    const { text: filteredContent } = filterBadWords(content.trim())

    // 길이 제한
    if (filteredContent.length > 500) return c.json({ success: false, error: '의제는 500자 이내로 작성해 주세요.' }, 400)

    await c.env.DB.prepare(
      `INSERT INTO agendas (content, name, phone, email, district, privacy_agreed) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      filteredContent,
      name.trim(),
      phone.trim(),
      email?.trim() || '',
      district.trim(),
      privacy_agreed ? 1 : 0
    ).run()

    return c.json({ success: true, message: '의제가 등록되었습니다.' })
  } catch (e) {
    console.error(e)
    return c.json({ success: false, error: '등록 중 오류가 발생했습니다.' }, 500)
  }
})
