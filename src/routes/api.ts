import { Hono } from 'hono'
import { db } from '../db'
import { filterBadWords } from '../utils/auth'

export const apiRoutes = new Hono()

// 의제 목록 (공개)
apiRoutes.get('/agendas', (c) => {
  try {
    const rows = db.prepare(
      `SELECT id, content, district, created_at FROM agendas WHERE status = 'visible' ORDER BY created_at DESC LIMIT 50`
    ).all()
    return c.json({ success: true, data: rows })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 단어 구름
apiRoutes.get('/word-cloud', (c) => {
  try {
    const rows = db.prepare(
      `SELECT content FROM agendas WHERE status = 'visible' ORDER BY created_at DESC LIMIT 200`
    ).all() as { content: string }[]

    const stopWords = new Set(['이', '가', '을', '를', '은', '는', '의', '에', '에서', '로', '으로', '와', '과', '도', '만', '이다', '있다', '하다', '그', '저', '이런', '저런', '있는', '없는', '너무', '정말', '매우', '좀', '더', '이제', '그냥', '거의', '아직', '이미', '그리고', '하지만', '또한', '또는', '그래서', '만약', '때문에', '위해', '위한', '하여', '않는', '않고', '않아', '없이', '있어', '해서', '해야', '해주', '주세요', '해주세요', '시켜', '시켜주세요', '부탁', '바랍니다', '합니다', '합시다', '해요', '이요', '예요', '어요', '아요'])

    const wordCount: Record<string, number> = {}
    for (const row of rows) {
      const words = row.content.split(/[\s,!?.·。、，！？\-\(\)\[\]「」『』【】]+/).filter(w => {
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
apiRoutes.get('/settings', (c) => {
  try {
    const rows = db.prepare(`SELECT key, value FROM site_settings`).all() as { key: string; value: string }[]
    const settings: Record<string, string> = {}
    for (const row of rows) settings[row.key] = row.value
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

    if (!content?.trim()) return c.json({ success: false, error: '의제 내용을 입력해 주세요.' }, 400)
    if (!name?.trim()) return c.json({ success: false, error: '이름을 입력해 주세요.' }, 400)
    if (!phone?.trim()) return c.json({ success: false, error: '연락처를 입력해 주세요.' }, 400)
    if (!district?.trim()) return c.json({ success: false, error: '거주 동을 입력해 주세요.' }, 400)
    if (!privacy_agreed) return c.json({ success: false, error: '개인정보 활용에 동의해 주세요.' }, 400)

    const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return c.json({ success: false, error: '올바른 전화번호 형식을 입력해 주세요.' }, 400)
    }

    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return c.json({ success: false, error: '올바른 이메일 형식을 입력해 주세요.' }, 400)
      }
    }

    const filteredContent = filterBadWords(content.trim())
    if (filteredContent.length > 500) return c.json({ success: false, error: '의제는 500자 이내로 작성해 주세요.' }, 400)

    db.prepare(
      `INSERT INTO agendas (content, name, phone, email, district, privacy_agreed) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(filteredContent, name.trim(), phone.trim(), email?.trim() || '', district.trim(), privacy_agreed ? 1 : 0)

    return c.json({ success: true, message: '의제가 등록되었습니다.' })
  } catch (e) {
    console.error(e)
    return c.json({ success: false, error: '등록 중 오류가 발생했습니다.' }, 500)
  }
})
