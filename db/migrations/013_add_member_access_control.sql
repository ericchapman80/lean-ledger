ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('admin', 'member'));

UPDATE users
SET role = 'admin'
WHERE id = 1;

CREATE TABLE IF NOT EXISTS allowed_emails (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member')),
  invited_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_allowed_emails_email
  ON allowed_emails (email);

INSERT INTO allowed_emails (email, role, invited_by_user_id, accepted_at)
SELECT LOWER(email), role, id, NOW()
FROM users
WHERE email IS NOT NULL
ON CONFLICT (email) DO UPDATE
SET
  role = EXCLUDED.role,
  accepted_at = COALESCE(allowed_emails.accepted_at, EXCLUDED.accepted_at),
  revoked_at = NULL;
