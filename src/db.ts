import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data')
const DB_PATH = path.join(DB_DIR, 'eco_agenda.db')

// 데이터 디렉토리 생성
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

export const db = new Database(DB_PATH)

// WAL 모드 (성능 향상)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 테이블 초기화
db.exec(`
  CREATE TABLE IF NOT EXISTS agendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    district TEXT NOT NULL,
    privacy_agreed INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'visible',
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS agenda_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agenda_id INTEGER NOT NULL,
    voter_key TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    UNIQUE(agenda_id, voter_key)
  );

  CREATE TABLE IF NOT EXISTS newsletters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    cover_image TEXT NOT NULL DEFAULT '',
    pdf_url TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published',
    created_at DATETIME DEFAULT (datetime('now','localtime')),
    updated_at DATETIME DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_agendas_status ON agendas(status);
  CREATE INDEX IF NOT EXISTS idx_agendas_created_at ON agendas(created_at);
  CREATE INDEX IF NOT EXISTS idx_agenda_likes_agenda_id ON agenda_likes(agenda_id);
  CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
  CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at);
`)

// 기본 설정값 삽입
const insertSetting = db.prepare(`INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)`)
const settings: [string, string][] = [
  ['main_title', '공론화하고 싶은 무엇이든 알려주세요'],
  ['main_subtitle', '순천에코칼리지에서 생태문명 도시 순천의 의제를 모읍니다. 시민들이 직접 느끼는 순천의 문제와 바람을 자유롭게 작성해 주시면, 생태적 공론장에서 다뤄질 수 있도록 최대한 반영해 보겠습니다.'],
  ['usage_guide', '이 곳에 기록된 희망 의제들은 순천시 생태적 공론장에 반영되어 공개적으로 논의될 예정입니다.'],
  ['forum_description', '기존의 인간중심의 정치·경제 중심 공론장에서 벗어나, 인간 뿐 아니라 생태계를 이루는 모든 비인간 존재와의 공존과 관계를 중심으로 논의를 확장해가는 공론장입니다.'],
  ['footer_blog', 'https://blog.naver.com/sunchonecocollege'],
  ['footer_facebook', 'https://facebook.com/sunchonecocollege'],
  ['footer_instagram', 'https://instagram.com/sunchon_ecocollege'],
  ['footer_phone', '061-123-4567'],
  ['footer_email', 'sunchon.eco@gmail.com'],
  ['hero_image', ''],
  // ABOUT/PROGRAM/APPLY 페이지 이미지
  ['about_eco_img', ''],
  ['about_philosophy_img', ''],
  ['about_org_img', ''],
  ['prog_2025_img', ''],
  ['prog_2026_img', ''],
  ['prog_forum_img', ''],
  ['apply_guide_img', ''],
  ['apply_agenda_img', ''],
  ['apply_contact_img', ''],
  // ABOUT 하위 메뉴 콘텐츠
  ['about_eco', '"또 다른 삶의 가능성은 없을까?"\n\n이 질문이 에코칼리지의 시작입니다. 지금까지의 삶에 의문을 품고, 다르게 살아야 한다는 것을 알지만, 어떻게 다르게 살아야할지 막막합니다. 우리는 그렇게 살도록 배운 적이 없으니까요.\n\n빨리, 많이, 나만을 외치던 것에서 벗어나, 천천히, 함께, 생명 모두의 세계를 만들려면, 새롭게 터득해야 합니다. 지금까지 배워왔던 방식에서 벗어나, 새롭게 상상하고, 먼저 살아보는 실험자가 되어야 하는 것이죠.\n\n지금, 지구와 우리의 삶이 어디로 가야할지 함께 묻고, 실험하고, 그 삶을 살아가는 새로운 개념의 학교를 시작하려고 합니다.\n\n삶이 바뀌려면, 우리가 지금까지 배우던 방식에서 벗어날 용기와 실천이 필요해요.\n\n함께 모이면, 그 용기가 생깁니다.'],
  ['about_philosophy', '생태문명으로의 전환은 단순한 환경 보호를 넘어, 인간과 자연의 관계를 새롭게 정립하는 것입니다. 우리는 시민 한 사람 한 사람이 생태적 감수성과 실천력을 갖출 수 있도록 교육합니다.'],
  ['about_org', '순천에코칼리지는 지역 시민사회·교육·연구 기관이 함께 참여하는 거버넌스 구조로 운영됩니다.'],
  // PROGRAM 하위 메뉴 콘텐츠
  ['prog_2025', '2025년도 시범 운영 과정으로, 생태시민 기초 교육과 현장 탐방을 결합한 입문 프로그램입니다. 순천 지역 생태 현장을 직접 체험하고 공론화 방법을 익힙니다.'],
  ['prog_2026', '생태문명 전환을 이끌어 갈 지역 촉진자를 양성하는 심화 과정입니다. 이론과 실천을 통합한 커리큘럼으로 지역사회 변화를 주도할 역량을 키웁니다.'],
  ['prog_forum', '시민이 직접 생태 의제를 발굴하고 토론하는 공론화 프로그램입니다. 이 페이지의 의제 등록 창구를 통해 시민 누구나 의제를 제안할 수 있습니다.'],
  // APPLY 하위 메뉴 콘텐츠
  ['apply_guide', '순천에코칼리지의 프로그램에 참여하시려면 공지되는 모집 일정에 따라 신청하시면 됩니다. 생태 의제 창구는 연중 상시 운영됩니다.'],
  ['apply_agenda', '순천에서 다뤄야 할 생태·환경 의제를 자유롭게 제안해 주세요. 제안하신 의제는 공론장 운영에 반영됩니다.'],
  ['apply_contact', '궁금하신 사항은 전화, 이메일, 또는 공식 블로그를 통해 문의해 주세요.'],
  // 메뉴 표시/숨김 (1=표시, 0=숨김)
  ['menu_visible_about_eco', '1'],
  ['menu_visible_about_philosophy', '1'],
  ['menu_visible_about_org', '1'],
  ['menu_visible_prog_2025', '1'],
  ['menu_visible_prog_2026', '1'],
  ['menu_visible_prog_forum', '1'],
  ['menu_visible_apply_guide', '1'],
  ['menu_visible_apply_agenda', '1'],
  ['menu_visible_apply_contact', '1'],
  ['menu_visible_newsletter', '1'],
]
for (const [k, v] of settings) insertSetting.run(k, v)

// 기본 관리자 계정 (비밀번호: admin1234)
// SHA-256: ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270
db.prepare(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`)
  .run('admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270')

console.log(`✅ DB initialized: ${DB_PATH}`)
