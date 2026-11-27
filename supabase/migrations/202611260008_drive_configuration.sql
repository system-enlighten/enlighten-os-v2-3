BEGIN;
CREATE TABLE IF NOT EXISTS enlighten_operational.drive_configuration (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE enlighten_operational.drive_configuration ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.drive_configuration FROM PUBLIC;
COMMIT;
