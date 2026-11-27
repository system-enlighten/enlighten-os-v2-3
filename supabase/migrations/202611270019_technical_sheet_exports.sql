CREATE TABLE enlighten_operational.technical_sheet_exports (
  export_id text PRIMARY KEY,
  project_id text NOT NULL,
  spreadsheet_id text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('building','complete')),
  model_hash text NOT NULL,
  manifest jsonb NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON enlighten_operational.technical_sheet_exports (project_id,created_at DESC)
  WHERE status='complete';
ALTER TABLE enlighten_operational.technical_sheet_exports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.technical_sheet_exports FROM PUBLIC;
