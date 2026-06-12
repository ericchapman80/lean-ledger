BEGIN;

CREATE TABLE IF NOT EXISTS household_link_invitations (
  id SERIAL PRIMARY KEY,
  household_id INTEGER NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  invited_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  note TEXT,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_household_link_invitations_household_id
  ON household_link_invitations(household_id);

CREATE INDEX IF NOT EXISTS idx_household_link_invitations_invited_user_id
  ON household_link_invitations(invited_user_id);

CREATE INDEX IF NOT EXISTS idx_household_link_invitations_invited_email
  ON household_link_invitations(lower(invited_email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_household_link_invitations_active_email
  ON household_link_invitations (household_id, lower(invited_email))
  WHERE accepted_at IS NULL AND declined_at IS NULL AND revoked_at IS NULL;

COMMIT;
