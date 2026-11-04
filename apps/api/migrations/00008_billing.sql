-- +goose Up
-- Pro access is a date: the learner has Pro while pro_until is in the future. Each
-- approved payment extends it from max(now, pro_until), so renewing early loses nothing.
ALTER TABLE users ADD COLUMN pro_until timestamptz;

CREATE TABLE coupons (
  code            text PRIMARY KEY CHECK (code ~ '^[A-Z0-9-]{3,32}$'),
  percent_off     integer NOT NULL CHECK (percent_off BETWEEN 1 AND 90),
  plans           text[] NOT NULL DEFAULT '{}', -- empty = every plan
  max_redemptions integer CHECK (max_redemptions > 0), -- NULL = unlimited
  valid_until     timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  note            text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Manual bKash/Nagad payments: the learner sends money, then submits the TrxID; an admin
-- checks it against the merchant statement and approves or rejects. Amounts are whole taka
-- and always computed by the server.
CREATE TABLE payment_orders (
  id              uuid PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan            text NOT NULL CHECK (plan IN ('monthly', 'yearly')),
  period_days     integer NOT NULL CHECK (period_days > 0),
  list_amount     integer NOT NULL CHECK (list_amount >= 0), -- crossed-out price
  base_amount     integer NOT NULL CHECK (base_amount >= 0), -- plan price before the coupon
  discount_amount integer NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  amount          integer NOT NULL CHECK (amount > 0),       -- what the learner must send
  coupon_code     text REFERENCES coupons(code),
  method          text NOT NULL CHECK (method IN ('bkash', 'nagad')),
  payer_number    text NOT NULL,
  trx_id          text NOT NULL CHECK (trx_id ~ '^[A-Z0-9]{8,20}$'),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason   text,
  reviewed_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
-- A TrxID pays for one order only (a rejected typo can be resubmitted correctly).
CREATE UNIQUE INDEX payment_orders_trx_uniq ON payment_orders (method, trx_id) WHERE status <> 'rejected';
-- One order under review per learner at a time.
CREATE UNIQUE INDEX payment_orders_one_pending ON payment_orders (user_id) WHERE status = 'pending';
CREATE INDEX payment_orders_user_idx ON payment_orders (user_id, created_at DESC);
CREATE INDEX payment_orders_review_idx ON payment_orders (status, created_at);
CREATE INDEX payment_orders_coupon_idx ON payment_orders (coupon_code) WHERE coupon_code IS NOT NULL;

-- +goose Down
DROP TABLE IF EXISTS payment_orders;
DROP TABLE IF EXISTS coupons;
ALTER TABLE users DROP COLUMN IF EXISTS pro_until;
