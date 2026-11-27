CREATE TABLE IF NOT EXISTS enlighten_operational.architectural_lighting_milestones (
  project_id text PRIMARY KEY,
  signed_at timestamptz NOT NULL,
  signed_by text NOT NULL
);
REVOKE ALL ON TABLE enlighten_operational.architectural_lighting_milestones FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON TABLE enlighten_operational.architectural_lighting_milestones TO service_role;
