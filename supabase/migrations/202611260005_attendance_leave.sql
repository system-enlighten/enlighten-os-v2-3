BEGIN;

CREATE TABLE IF NOT EXISTS enlighten_operational.studio_leave_requests (
  record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_row_number integer,
  cells jsonb NOT NULL CHECK (jsonb_typeof(cells) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS studio_leave_requests_id
  ON enlighten_operational.studio_leave_requests ((cells->>'id'));
CREATE INDEX IF NOT EXISTS studio_leave_requests_employee
  ON enlighten_operational.studio_leave_requests ((cells->>'userId'));
ALTER TABLE enlighten_operational.studio_leave_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.studio_leave_requests FROM PUBLIC;

COMMIT;
