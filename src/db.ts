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

  CREATE INDEX IF NOT EXISTS idx_agendas_status ON agendas(status);
  CREATE INDEX IF NOT EXISTS idx_agendas_created_at ON agendas(created_at);
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
]
for (const [k, v] of settings) insertSetting.run(k, v)

// 기본 관리자 계정 (비밀번호: admin1234)
// SHA-256: ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270
db.prepare(`INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)`)
  .run('admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270')

console.log(`✅ DB initialized: ${DB_PATH}`)
