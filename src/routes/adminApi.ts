import { Hono } from 'hono'
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../utils/auth'

type Bindings = { DB: D1Database; ADMIN_SECRET: string }

const ADMIN_SECRET_FALLBACK = 'sunchon-eco-2024-secret'

function getSecret(env: Bindings) {
  return env.ADMIN_SECRET || ADMIN_SECRET_FALLBACK
}

// 관리자 인증 미들웨어
async function authMiddleware(c: any, next: any) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '') ||
    c.req.query('token')
  if (!token) return c.json({ success: false, error: '인증이 필요합니다.' }, 401)

  const secret = getSecret(c.env)
  const username = verifyToken(token, secret)
  if (!username) return c.json({ success: false, error: '유효하지 않은 토큰입니다.' }, 401)

  c.set('adminUser', username)
  await next()
}

export const adminRoutes = new Hono<{ Bindings: Bindings }>()

// 관리자 로그인
adminRoutes.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    if (!username || !password) return c.json({ success: false, error: '아이디와 비밀번호를 입력해 주세요.' }, 400)

    const admin = await c.env.DB.prepare(
      `SELECT * FROM admins WHERE username = ?`
    ).bind(username).first() as any

    if (!admin) return c.json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401)

    const valid = await verifyPassword(password, admin.password_hash)
    if (!valid) return c.json({ success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401)

    const secret = getSecret(c.env)
    const token = generateToken(username, secret)

    return c.json({ success: true, token, username })
  } catch (e) {
    console.error(e)
    return c.json({ success: false, error: '로그인 중 오류가 발생했습니다.' }, 500)
  }
})

// 관리자 비밀번호 변경
adminRoutes.post('/change-password', authMiddleware, async (c) => {
  try {
    const { current_password, new_password } = await c.req.json()
    const username = c.get('adminUser') as string

    const admin = await c.env.DB.prepare(
      `SELECT * FROM admins WHERE username = ?`
    ).bind(username).first() as any

    const valid = await verifyPassword(current_password, admin.password_hash)
    if (!valid) return c.json({ success: false, error: '현재 비밀번호가 올바르지 않습니다.' }, 400)

    if (new_password.length < 6) return c.json({ success: false, error: '새 비밀번호는 6자 이상이어야 합니다.' }, 400)

    const newHash = await hashPassword(new_password)
    await c.env.DB.prepare(
      `UPDATE admins SET password_hash = ? WHERE username = ?`
    ).bind(newHash, username).run()

    return c.json({ success: true, message: '비밀번호가 변경되었습니다.' })
  } catch (e) {
    return c.json({ success: false, error: '오류가 발생했습니다.' }, 500)
  }
})

// 전체 의제 목록 (관리자용 - 모든 상태 포함)
adminRoutes.get('/agendas', authMiddleware, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit
    const status = c.req.query('status') || 'all'
    const search = c.req.query('search') || ''

    let whereClause = status === 'all' ? "status != 'deleted'" : `status = '${status}'`
    if (search) whereClause += ` AND (content LIKE '%${search}%' OR name LIKE '%${search}%' OR district LIKE '%${search}%')`

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM agendas WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset).all()

    const countResult = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM agendas WHERE ${whereClause}`
    ).first() as any

    return c.json({
      success: true,
      data: results,
      total: countResult.count,
      page,
      totalPages: Math.ceil(countResult.count / limit)
    })
  } catch (e) {
    console.error(e)
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 의제 상태 변경 (가리기/보이기/삭제)
adminRoutes.patch('/agendas/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id')
    const { status } = await c.req.json()

    if (!['visible', 'hidden', 'deleted'].includes(status)) {
      return c.json({ success: false, error: '올바르지 않은 상태값입니다.' }, 400)
    }

    await c.env.DB.prepare(
      `UPDATE agendas SET status = ? WHERE id = ?`
    ).bind(status, id).run()

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

    await c.env.DB.prepare(
      `UPDATE agendas SET content = ? WHERE id = ?`
    ).bind(content.trim(), id).run()

    return c.json({ success: true, message: '수정되었습니다.' })
  } catch (e) {
    return c.json({ success: false, error: '오류가 발생했습니다.' }, 500)
  }
})

// CSV 다운로드 데이터 반환
adminRoutes.get('/export', authMiddleware, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT id, content, name, phone, email, district, privacy_agreed, status, created_at 
       FROM agendas WHERE status != 'deleted' ORDER BY created_at DESC`
    ).all()

    // CSV 생성
    const headers = ['번호', '의제내용', '이름', '연락처', '이메일', '거주동', '개인정보동의', '상태', '등록일시']
    const rows = results.map((r: any) => [
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

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n')

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="agenda_${new Date().toISOString().slice(0, 10)}.csv"`
      }
    })
  } catch (e) {
    console.error(e)
    return c.json({ success: false, error: '내보내기 오류' }, 500)
  }
})

// 사이트 설정 저장
adminRoutes.post('/settings', authMiddleware, async (c) => {
  try {
    const settings = await c.req.json()

    for (const [key, value] of Object.entries(settings)) {
      await c.env.DB.prepare(
        `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      ).bind(key, value as string).run()
    }

    return c.json({ success: true, message: '설정이 저장되었습니다.' })
  } catch (e) {
    console.error(e)
    return c.json({ success: false, error: '설정 저장 오류' }, 500)
  }
})

// 통계
adminRoutes.get('/stats', authMiddleware, async (c) => {
  try {
    const total = await c.env.DB.prepare(`SELECT COUNT(*) as n FROM agendas WHERE status != 'deleted'`).first() as any
    const visible = await c.env.DB.prepare(`SELECT COUNT(*) as n FROM agendas WHERE status = 'visible'`).first() as any
    const hidden = await c.env.DB.prepare(`SELECT COUNT(*) as n FROM agendas WHERE status = 'hidden'`).first() as any
    const today = await c.env.DB.prepare(`SELECT COUNT(*) as n FROM agendas WHERE date(created_at) = date('now') AND status != 'deleted'`).first() as any

    return c.json({
      success: true,
      data: {
        total: (total as any)?.n || 0,
        visible: (visible as any)?.n || 0,
        hidden: (hidden as any)?.n || 0,
        today: (today as any)?.n || 0
      }
    })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})
