BEGIN;
CREATE TABLE IF NOT EXISTS enlighten_operational.project_entity_sequences (
  entity text PRIMARY KEY,
  value bigint NOT NULL CHECK (value > 0)
);
ALTER TABLE enlighten_operational.project_entity_sequences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.project_entity_sequences FROM PUBLIC;
COMMIT;
