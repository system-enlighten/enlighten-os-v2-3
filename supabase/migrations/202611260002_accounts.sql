BEGIN;

CREATE TABLE IF NOT EXISTS enlighten_operational.accounts_chart (
  head text PRIMARY KEY,
  account_type text NOT NULL,
  subhead text NOT NULL DEFAULT '',
  deleted boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS enlighten_operational.project_contracts (
  project_id text PRIMARY KEY,
  contract jsonb NOT NULL CHECK (jsonb_typeof(contract) = 'object')
);

CREATE TABLE IF NOT EXISTS enlighten_operational.accounts_transaction_attachments (
  id text PRIMARY KEY,
  transaction_id text NOT NULL,
  file_id text NOT NULL,
  name text NOT NULL,
  mime_type text NOT NULL,
  author text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enlighten_operational.accounts_journal_history (
  history_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  journal_record_id bigint NOT NULL REFERENCES enlighten_operational.accounts_journal(record_id),
  action text NOT NULL,
  actor text NOT NULL,
  before_record jsonb NOT NULL,
  after_record jsonb NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enlighten_operational.accounts_chart ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.project_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.accounts_transaction_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.accounts_journal_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.accounts_chart, enlighten_operational.project_contracts,
  enlighten_operational.accounts_transaction_attachments, enlighten_operational.accounts_journal_history FROM PUBLIC;

COMMIT;
