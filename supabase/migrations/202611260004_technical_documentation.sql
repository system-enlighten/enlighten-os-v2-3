BEGIN;

CREATE TABLE IF NOT EXISTS enlighten_operational.technical_documentation (
  record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_row_number integer,
  cells jsonb NOT NULL CHECK (jsonb_typeof(cells) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS technical_documentation_project
  ON enlighten_operational.technical_documentation ((cells->>'projectId'));

CREATE TABLE IF NOT EXISTS enlighten_operational.technical_documentation_chunks (
  record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_row_number integer,
  cells jsonb NOT NULL CHECK (jsonb_typeof(cells) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS technical_documentation_chunk
  ON enlighten_operational.technical_documentation_chunks ((cells->>'projectId'),(cells->>'version'),(cells->>'chunkIndex'));

ALTER TABLE enlighten_operational.technical_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.technical_documentation_chunks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.technical_documentation,enlighten_operational.technical_documentation_chunks FROM PUBLIC;

COMMIT;
