-- +goose Up
-- Settings an admin can change from the panel without a redeploy. A missing row falls back
-- to the environment (PAY_BKASH_NUMBER, …); an empty value turns that method off.
CREATE TABLE app_settings (
  key        text PRIMARY KEY CHECK (key IN ('pay_bkash_number', 'pay_nagad_number')),
  value      text NOT NULL,
  updated_by uuid REFERENCES users (id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_created_idx ON audit_logs (created_at DESC);

-- +goose Down
DROP INDEX audit_logs_created_idx;
DROP TABLE app_settings;
