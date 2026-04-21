import { Hono } from 'hono'
import { db } from '../db'
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../utils/auth'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sunchon-eco-2024-secret'

// 인증 미들웨어
async function authMiddleware(c: any, next: any) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '') || c.req.query('token')
  if (!token) return c.json({ success: false, error: '인증이 필요합니다.' }, 401)
  const username = verifyToken(token, ADMIN_SECRET)
  if (!username) return c.json({ success: false, error: '유효하지 않은 토큰입니다.' }, 401)
  c.set('adminUser', username)
  await next()
}

export const adminRoutes = new Hono()

// 로그인
adminRoutes.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    if (!username || !password) return c.json({ success: false, error: '아이디와 비밀번호를 입력해 주세요.' }, 400)

    const admin = db.prepare(`SELECT * FROM admins WHERE username = ?`).get(username) as any
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      return c.json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401)
    }

    const token = generateToken(username, ADMIN_SECRET)
    return c.json({ success: true, token, username })
  } catch (e) {
    return c.json({ success: false, error: '로그인 중 오류가 발생했습니다.' }, 500)
  }
})

// 비밀번호 변경
adminRoutes.post('/change-password', authMiddleware, async (c) => {
  try {
    const { current_password, new_password } = await c.req.json()
    const username = c.get('adminUser') as string
    const admin = db.prepare(`SELECT * FROM admins WHERE username = ?`).get(username) as any

    if (!verifyPassword(current_password, admin.password_hash)) {
      return c.json({ success: false, error: '현재 비밀번호가 올바르지 않습니다.' }, 400)
    }
    if (new_password.length < 6) return c.json({ success: false, error: '새 비밀번호는 6자 이상이어야 합니다.' }, 400)

    db.prepare(`UPDATE admins SET password_hash = ? WHERE username = ?`)
      .run(hashPassword(new_password), username)
    return c.json({ success: true, message: '비밀번호가 변경되었습니다.' })
  } catch (e) {
    return c.json({ success: false, error: '오류가 발생했습니다.' }, 500)
  }
})

// 전체 의제 목록 (관리자)
adminRoutes.get('/agendas', authMiddleware, (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit
    const status = c.req.query('status') || 'all'
    const search = c.req.query('search') || ''

    let where = status === 'all' ? "status != 'deleted'" : `status = '${status}'`
    if (search) {
      const s = search.replace(/'/g, "''")
      where += ` AND (content LIKE '%${s}%' OR name LIKE '%${s}%' OR district LIKE '%${s}%')`
    }

    const rows = db.prepare(`SELECT * FROM agendas WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(limit, offset)
    const { count } = db.prepare(`SELECT COUNT(*) as count FROM agendas WHERE ${where}`).get() as any

    return c.json({ success: true, data: rows, total: count, page, totalPages: Math.ceil(count / limit) })
  } catch (e) {
    console.error(e)
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 의제 상태 변경
adminRoutes.patch('/agendas/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const { status } = await c.req.json()
    if (!['visible', 'hidden', 'deleted'].includes(status)) {
      return c.json({ success: false, error: '올바르지 않은 상태값입니다.' }, 400)
    }
    db.prepare(`UPDATE agendas SET status = ? WHERE id = ?`).run(status, id)
    return c.json({ success: true, message: '상태가 변경되었습니다.' })
  } catch (e) {
    return c.json({ success: false, error: '오류가 발생했습니다.' }, 500)
  }
})

// 의제 내용 수정
adminRoutes.put('/agendas/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const { content } = await c.req.json()
    if (!content?.trim()) return c.json({ success: false, error: '내용을 입력해 주세요.' }, 400)
    db.prepare(`UPDATE agendas SET content = ? WHERE id = ?`).run(content.trim(), id)
    return c.json({ success: true, message: '수정되었습니다.' })
  } catch (e) {
    return c.json({ success: false, error: '오류가 발생했습니다.' }, 500)
  }
})

// CSV 내보내기
adminRoutes.get('/export', authMiddleware, (c) => {
  try {
    const rows = db.prepare(
      `SELECT id, content, name, phone, email, district, privacy_agreed, status, created_at 
       FROM agendas WHERE status != 'deleted' ORDER BY created_at DESC`
    ).all() as any[]

    const headers = ['번호', '의제내용', '이름', '연락처', '이메일', '거주동', '개인정보동의', '상태', '등록일시']
    const csvRows = rows.map(r => [
      r.id,
      `"${(r.content || '').replace(/"/g, '""')}"`,
      `"${r.name}"`,
      r.phone,
      r.email || '',
      `"${r.district}"`,
      r.privacy_agreed ? '동의' : '미동의',
      r.status === 'visible' ? '공개' : '숨김',
      r.created_at
    ].join(','))

    const csv = '\uFEFF' + [headers.join(','), ...csvRows].join('\n')
    const filename = `agenda_${new Date().toISOString().slice(0, 10)}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (e) {
    return c.json({ success: false, error: '내보내기 오류' }, 500)
  }
})

// 설정 저장
adminRoutes.post('/settings', authMiddleware, async (c) => {
  try {
    const settings = await c.req.json()
    const upsert = db.prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now','localtime'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    for (const [key, value] of Object.entries(settings)) {
      upsert.run(key, value as string)
    }
    return c.json({ success: true, message: '설정이 저장되었습니다.' })
  } catch (e) {
    return c.json({ success: false, error: '설정 저장 오류' }, 500)
  }
})

// ── 뉴스레터 API ────────────────────────────────────────────────
// 목록
adminRoutes.get('/newsletters', authMiddleware, (c) => {
  try {
    const rows = db.prepare(`SELECT id, title, summary, cover_image, pdf_url, status, created_at FROM newsletters ORDER BY created_at DESC`).all()
    return c.json({ success: true, data: rows })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 단건 조회
adminRoutes.get('/newsletters/:id', authMiddleware, (c) => {
  try {
    const row = db.prepare(`SELECT * FROM newsletters WHERE id = ?`).get(c.req.param('id'))
    if (!row) return c.json({ success: false, error: '없음' }, 404)
    return c.json({ success: true, data: row })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 생성
adminRoutes.post('/newsletters', authMiddleware, async (c) => {
  try {
    const { title, content, summary, cover_image, pdf_url, status } = await c.req.json()
    if (!title?.trim()) return c.json({ success: false, error: '제목을 입력해 주세요.' }, 400)
    const result = db.prepare(
      `INSERT INTO newsletters (title, content, summary, cover_image, pdf_url, status) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(title.trim(), content || '', summary || '', cover_image || '', pdf_url || '', status || 'published') as any
    return c.json({ success: true, id: result.lastInsertRowid })
  } catch (e) {
    return c.json({ success: false, error: '저장 오류' }, 500)
  }
})

// 수정
adminRoutes.put('/newsletters/:id', authMiddleware, async (c) => {
  try {
    const { title, content, summary, cover_image, pdf_url, status } = await c.req.json()
    if (!title?.trim()) return c.json({ success: false, error: '제목을 입력해 주세요.' }, 400)
    db.prepare(
      `UPDATE newsletters SET title=?, content=?, summary=?, cover_image=?, pdf_url=?, status=?, updated_at=datetime('now','localtime') WHERE id=?`
    ).run(title.trim(), content || '', summary || '', cover_image || '', pdf_url || '', status || 'published', c.req.param('id'))
    return c.json({ success: true })
  } catch (e) {
    return c.json({ success: false, error: '수정 오류' }, 500)
  }
})

// 삭제
adminRoutes.delete('/newsletters/:id', authMiddleware, async (c) => {
  try {
    db.prepare(`DELETE FROM newsletters WHERE id = ?`).run(c.req.param('id'))
    return c.json({ success: true })
  } catch (e) {
    return c.json({ success: false, error: '삭제 오류' }, 500)
  }
})

// ── 금칙어 관리 API ─────────────────────────────────────────────
// 목록 조회
adminRoutes.get('/banned-words', authMiddleware, (c) => {
  try {
    const rows = db.prepare(`SELECT id, word, created_at FROM banned_words ORDER BY created_at DESC`).all()
    return c.json({ success: true, data: rows })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 단어 추가
adminRoutes.post('/banned-words', authMiddleware, async (c) => {
  try {
    const { word } = await c.req.json()
    if (!word?.trim()) return c.json({ success: false, error: '단어를 입력해 주세요.' }, 400)
    const trimmed = word.trim()
    if (trimmed.length < 1 || trimmed.length > 50) {
      return c.json({ success: false, error: '1~50자 사이의 단어를 입력해 주세요.' }, 400)
    }
    // 중복 확인
    const existing = db.prepare(`SELECT id FROM banned_words WHERE word = ?`).get(trimmed)
    if (existing) return c.json({ success: false, error: '이미 등록된 단어입니다.' }, 409)
    const result = db.prepare(`INSERT INTO banned_words (word) VALUES (?)`).run(trimmed) as any
    return c.json({ success: true, id: result.lastInsertRowid, word: trimmed })
  } catch (e) {
    return c.json({ success: false, error: '저장 오류' }, 500)
  }
})

// 단어 삭제
adminRoutes.delete('/banned-words/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const row = db.prepare(`SELECT id FROM banned_words WHERE id = ?`).get(id)
    if (!row) return c.json({ success: false, error: '존재하지 않는 단어입니다.' }, 404)
    db.prepare(`DELETE FROM banned_words WHERE id = ?`).run(id)
    return c.json({ success: true })
  } catch (e) {
    return c.json({ success: false, error: '삭제 오류' }, 500)
  }
})

// 단어 수정
adminRoutes.put('/banned-words/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const { word } = await c.req.json()
    if (!word?.trim()) return c.json({ success: false, error: '단어를 입력해 주세요.' }, 400)
    const trimmed = word.trim()
    const existing = db.prepare(`SELECT id FROM banned_words WHERE word = ? AND id != ?`).get(trimmed, id)
    if (existing) return c.json({ success: false, error: '이미 등록된 단어입니다.' }, 409)
    db.prepare(`UPDATE banned_words SET word = ? WHERE id = ?`).run(trimmed, id)
    return c.json({ success: true })
  } catch (e) {
    return c.json({ success: false, error: '수정 오류' }, 500)
  }
})

// 통계
adminRoutes.get('/stats', authMiddleware, (c) => {
  try {
    const total = (db.prepare(`SELECT COUNT(*) as n FROM agendas WHERE status != 'deleted'`).get() as any).n
    const visible = (db.prepare(`SELECT COUNT(*) as n FROM agendas WHERE status = 'visible'`).get() as any).n
    const hidden = (db.prepare(`SELECT COUNT(*) as n FROM agendas WHERE status = 'hidden'`).get() as any).n
    const today = (db.prepare(`SELECT COUNT(*) as n FROM agendas WHERE date(created_at) = date('now','localtime') AND status != 'deleted'`).get() as any).n
    return c.json({ success: true, data: { total, visible, hidden, today } })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})
