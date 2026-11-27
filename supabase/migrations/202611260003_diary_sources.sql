BEGIN;

CREATE TABLE IF NOT EXISTS enlighten_operational.mom_visit_points (
  record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_row_number integer,
  cells jsonb NOT NULL CHECK (jsonb_typeof(cells) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS mom_visit_points_source_key
  ON enlighten_operational.mom_visit_points ((cells->>'pointKey'))
  WHERE NULLIF(cells->>'pointKey','') IS NOT NULL;

CREATE TABLE IF NOT EXISTS enlighten_operational.historical_workflow_meetings (
  record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_row_number integer,
  cells jsonb NOT NULL CHECK (jsonb_typeof(cells) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enlighten_operational.mom_visit_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.historical_workflow_meetings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.mom_visit_points,enlighten_operational.historical_workflow_meetings FROM PUBLIC;

COMMIT;
