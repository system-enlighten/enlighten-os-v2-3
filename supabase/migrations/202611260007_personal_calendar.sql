BEGIN;
CREATE TABLE IF NOT EXISTS enlighten_operational.personal_calendar_blocks (
  record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_row_number integer,
  cells jsonb NOT NULL CHECK (jsonb_typeof(cells) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS personal_calendar_block_id
  ON enlighten_operational.personal_calendar_blocks ((cells->>'id'));
CREATE INDEX IF NOT EXISTS personal_calendar_block_employee
  ON enlighten_operational.personal_calendar_blocks ((cells->>'userId'));
ALTER TABLE enlighten_operational.personal_calendar_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.personal_calendar_blocks FROM PUBLIC;
COMMIT;
