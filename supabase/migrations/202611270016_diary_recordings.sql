CREATE TABLE enlighten_operational.diary_recording_chunks (
  chunk_key text PRIMARY KEY,
  project_id text NOT NULL,
  entry_id text NOT NULL,
  cells jsonb NOT NULL
);
CREATE INDEX ON enlighten_operational.diary_recording_chunks(project_id,entry_id);
ALTER TABLE enlighten_operational.diary_recording_chunks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.diary_recording_chunks FROM PUBLIC;
