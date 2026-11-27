BEGIN;
CREATE TABLE IF NOT EXISTS enlighten_operational.received_upload_aliases (
  record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_row_number integer,
  cells jsonb NOT NULL CHECK (jsonb_typeof(cells) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS received_upload_alias_id
  ON enlighten_operational.received_upload_aliases ((cells->>'uploadId'));
ALTER TABLE enlighten_operational.received_upload_aliases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.received_upload_aliases FROM PUBLIC;
COMMIT;
