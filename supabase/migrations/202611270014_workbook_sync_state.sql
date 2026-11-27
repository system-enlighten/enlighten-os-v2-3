CREATE TABLE enlighten_operational.workbook_sync_state (
  table_name text NOT NULL,
  source_key text NOT NULL,
  source_hash text NOT NULL,
  record_id bigint NOT NULL,
  PRIMARY KEY (table_name,source_key),
  UNIQUE (table_name,record_id)
);
ALTER TABLE enlighten_operational.workbook_sync_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.workbook_sync_state FROM PUBLIC;
