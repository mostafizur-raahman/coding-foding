-- +goose Up
-- Passwordless sign-in: an emailed 6-digit code proves the address. New users then
-- complete a short profile; district replaces asking for the division separately.

ALTER TABLE users
  ADD COLUMN phone     text CHECK (phone ~ '^\+8801[3-9][0-9]{8}$'),        -- E.164, Bangladeshi mobile
  ADD COLUMN district  text CHECK (district ~ '^[a-z]+$'),
  ADD COLUMN interests text[] NOT NULL DEFAULT '{}';

-- One row per code sent. The code itself is never stored: code_mac = HMAC(secret, id || code),
-- so a database leak can't be brute-forced offline.
CREATE TABLE email_challenges (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  email              citext      NOT NULL,
  code_mac           bytea       NOT NULL,
  attempts           integer     NOT NULL DEFAULT 0,
  expires_at         timestamptz NOT NULL,
  verified_at        timestamptz,
  -- Set when a verified email has no account yet: lets the client finish signing up.
  signup_token_hash  bytea UNIQUE,
  signup_expires_at  timestamptz,
  signup_used_at     timestamptz,
  ip                 inet,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX email_challenges_email_recent_idx ON email_challenges (email, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS email_challenges;
ALTER TABLE users DROP COLUMN IF EXISTS interests, DROP COLUMN IF EXISTS district, DROP COLUMN IF EXISTS phone;
