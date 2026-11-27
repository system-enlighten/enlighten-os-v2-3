CREATE TABLE IF NOT EXISTS enlighten_operational.accounts_receipt_drafts (
  id text PRIMARY KEY,
  author text NOT NULL,
  transaction_id uuid NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('processing','ready')),
  lease uuid NOT NULL,
  data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE enlighten_operational.accounts_receipt_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.accounts_receipt_drafts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON enlighten_operational.accounts_receipt_drafts TO service_role;
