-- Works shown in the portfolio gallery
CREATE TABLE IF NOT EXISTS works (
  id         TEXT PRIMARY KEY,
  sort       INTEGER NOT NULL DEFAULT 0,
  kind       TEXT NOT NULL DEFAULT 'video',   -- video | audio | youtube
  src        TEXT NOT NULL,                    -- file URL, or YouTube URL
  poster     TEXT NOT NULL DEFAULT '',
  dialects   TEXT NOT NULL DEFAULT '',         -- comma list: eg,fusha,sa,en
  type       TEXT NOT NULL DEFAULT 'ad',
  title_ar   TEXT NOT NULL DEFAULT '',
  title_en   TEXT NOT NULL DEFAULT '',
  note_ar    TEXT NOT NULL DEFAULT '',
  note_en    TEXT NOT NULL DEFAULT '',
  dur        INTEGER NOT NULL DEFAULT 0,
  visible    INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS works_sort ON works(sort);

-- Admin password hash, session secret
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Failed-login throttling
CREATE TABLE IF NOT EXISTS login_attempts (
  ip  TEXT NOT NULL,
  at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS login_attempts_ip ON login_attempts(ip, at);
