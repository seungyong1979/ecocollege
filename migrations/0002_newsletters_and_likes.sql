-- 의제 좋아요 테이블
CREATE TABLE IF NOT EXISTS agenda_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agenda_id INTEGER NOT NULL,
  voter_key TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agenda_id, voter_key),
  FOREIGN KEY (agenda_id) REFERENCES agendas(id)
);

CREATE INDEX IF NOT EXISTS idx_likes_agenda ON agenda_likes(agenda_id);

-- 뉴스레터 테이블 (pdf_url 포함)
CREATE TABLE IF NOT EXISTS newsletters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  pdf_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at);
