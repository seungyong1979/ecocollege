import { Hono } from 'hono'
import { db } from '../db'
import { filterBadWords } from '../utils/auth'

// DB에서 금칙어를 동적으로 불러와 필터링
function filterBadWordsFromDB(text: string): string {
  try {
    const rows = db.prepare(`SELECT word FROM banned_words`).all() as { word: string }[]
    let result = text
    for (const { word } of rows) {
      // 대소문자 구분 없이, 글로벌 치환
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      result = result.replace(new RegExp(escaped, 'gi'), '*'.repeat(word.length))
    }
    return result
  } catch {
    // DB 오류 시 기본 필터 사용
    return filterBadWords(text)
  }
}

export const apiRoutes = new Hono()

// 의제 목록 (공개) - 좋아요 수 포함 (최신 50개)
apiRoutes.get('/agendas', (c) => {
  try {
    const rows = db.prepare(
      `SELECT a.id, a.content, a.district, a.created_at,
              COUNT(l.id) as likes
       FROM agendas a
       LEFT JOIN agenda_likes l ON l.agenda_id = a.id
       WHERE a.status = 'visible'
       GROUP BY a.id
       ORDER BY a.created_at DESC LIMIT 50`
    ).all()
    return c.json({ success: true, data: rows })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 전체 의제 목록 (공개) - 페이지네이션 없이 전체
apiRoutes.get('/agendas/all', (c) => {
  try {
    const rows = db.prepare(
      `SELECT a.id, a.content, a.district, a.created_at,
              COUNT(l.id) as likes
       FROM agendas a
       LEFT JOIN agenda_likes l ON l.agenda_id = a.id
       WHERE a.status = 'visible'
       GROUP BY a.id
       ORDER BY a.created_at DESC`
    ).all()
    return c.json({ success: true, data: rows, total: (rows as any[]).length })
  } catch (e) {
    return c.json({ success: false, error: 'DB 오류' }, 500)
  }
})

// 좋아요 토글
apiRoutes.post('/agendas/:id/like', async (c) => {
  try {
    const agendaId = c.req.param('id')
    // voter_key: IP + User-Agent 해시 (쿠키 없이 간단 식별)
    const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
      || c.req.header('x-real-ip')
      || 'unknown'
    const ua = c.req.header('user-agent') || ''
    // 간단 해시: IP + UA 앞 50자 조합
    const voterKey = Buffer.from(`${ip}:${ua.slice(0, 50)}`).toString('base64').slice(0, 32)

    // 이미 좋아요 했는지 확인
    const existing = db.prepare(
      `SELECT id FROM agenda_likes WHERE agenda_id = ? AND voter_key = ?`
    ).get(agendaId, voterKey)

    if (existing) {
      // 좋아요 취소
      db.prepare(`DELETE FROM agenda_likes WHERE agenda_id = ? AND voter_key = ?`).run(agendaId, voterKey)
    } else {
      // 좋아요 추가
      db.prepare(`INSERT OR IGNORE INTO agenda_likes (agenda_id, voter_key) VALUES (?, ?)`).run(agendaId, voterKey)
    }

    const { likes } = db.prepare(`SELECT COUNT(*) as likes FROM agenda_likes WHERE agenda_id = ?`).get(agendaId) as any
    return c.json({ success: true, likes, liked: !existing })
  } catch (e) {
    console.error(e)
    return c.json({ success: false, error: '오류가 발생했습니다.' }, 500)
  }
})

// 단어 구름 - 명사만 추출
apiRoutes.get('/word-cloud', (c) => {
  try {
    const rows = db.prepare(
      `SELECT content FROM agendas WHERE status = 'visible' ORDER BY created_at DESC LIMIT 200`
    ).all() as { content: string }[]

    // ── 불용어: 조사·어미·접속사·부사·대명사·동사어간·형용사어간 등 ──
    const stopWords = new Set([
      // 조사
      '이','가','을','를','은','는','의','에','에서','로','으로','와','과','도','만',
      '에게','한테','께서','에서는','에서도','에게서','부터','까지','라도','이라도',
      '이나','나','이며','며','이라','라','마저','조차','밖에','들','뿐','처럼','같이',
      // 어미 결합형 (동사/형용사 어간)
      '이다','있다','하다','없다','되다','않다','이고','이며','이야','이에','이지',
      '있고','있어','있는','있게','없고','없어','없는','하고','하여','해서','하면',
      '하는','하지','해야','해요','합니다','했다','했습니다','한다','했어','하자',
      '되고','되어','되는','되면','됩니다','됐다','됐습니다',
      '않고','않아','않는','않게','못하고','못해',
      // 부사
      '매우','정말','너무','좀','더','꼭','반드시','빨리','많이','자주','항상',
      '이제','그냥','거의','아직','이미','바로','특히','또한','또는','그리고',
      '하지만','그러나','그래서','만약','따라서','그런데','물론','아마','다시',
      '그래도','게다가','오히려','더욱','상당히','충분히','제대로','빠르게',
      '지속적으로','적극적으로','지금','최대한','앞으로','함께',
      // 대명사
      '그','저','이','저것','이것','그것','우리','우리들','모두','여기','거기',
      '이곳','저곳','그곳',
      // 동사어간 단독(분리된 경우)
      '주세요','해주세요','시켜','시켜주세요','해주','부탁','바랍니다',
      '합시다','이요','예요','어요','아요','이에요','일까요','인가요',
      '같습니다','것입니다','것이다','위해','위한','통해','통한',
      '관련','관한','관련된','대한','대해','대해서','때문에','인해','인한',
      // 일반 불용어
      '등','기타','및','즉','약','또','및','곧','총','간','내','외','전','후',
      '것','수','때','곳','점','분','년','월','일','번','개','명','개월',
      '있습니다','없습니다','합니다','됩니다','됩니다','입니다','습니다',
    ])

    // 한국어 명사 패턴 체크 함수
    // 한글 2글자 이상이고 조사/어미로 끝나지 않으면 명사로 간주
    function isNoun(word: string): boolean {
      if (!word) return false
      const clean = word.trim()
      // 2글자 미만 제외
      if (clean.length < 2) return false
      // 불용어 제외
      if (stopWords.has(clean)) return false
      // 한글이 포함되어 있어야 함 (숫자+한글 조합 허용)
      if (!/[가-힣]/.test(clean)) return false
      // 순수 숫자 제외
      if (/^\d+$/.test(clean)) return false
      // 동사/형용사 어미로 끝나는 단어 제외
      const verbEndings = ['하다','되다','이다','있다','없다','하고','하여','하면',
        '하는','하지','해서','하기','하게','하며','할','함','했','한','할수',
        '되고','되어','되는','되면','되기','됩니다','됐','된','될',
        '않다','않고','않아','않는','못하','이고','이며','이라','이야',
        '이에','이지','라고','라면','라서','어서','아서','으면','으로',
        '에서','에게','한테','에도','에만','이나','나서','고서']
      for (const ending of verbEndings) {
        if (clean.endsWith(ending) && clean !== ending) return false
      }
      // 숫자로만 구성+단위 패턴 (예: 3개, 2명, 10개소) 제외
      if (/^\d+[가-힣]{1,2}$/.test(clean)) return false
      return true
    }

    const wordCount: Record<string, number> = {}
    for (const row of rows) {
      const words = row.content
        .split(/[\s,!?.·。、，！？\-\(\)\[\]「」『』【】"'""''\/\\|~`@#$%^&*+=<>;:]+/)
        .map(w => w.replace(/^[^가-힣a-zA-Z0-9]+|[^가-힣a-zA-Z0-9]+$/g, '')) // 앞뒤 특수문자 제거
        .filter(w => isNoun(w))
      for (const word of words) {
        wordCount[word] = (wordCount[word] || 0) + 1
      }
    }

    const sorted = Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
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

    const filteredContent = filterBadWordsFromDB(content.trim())
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
