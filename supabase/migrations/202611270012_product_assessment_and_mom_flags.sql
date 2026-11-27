CREATE TABLE enlighten_operational.product_assessments (
  project_id text PRIMARY KEY,
  cells jsonb NOT NULL CHECK (cells->>'projectId' = project_id AND cells ? 'version')
);
CREATE TABLE enlighten_operational.product_assessment_chunks (
  project_id text NOT NULL REFERENCES enlighten_operational.product_assessments(project_id),
  version text NOT NULL,
  chunk_index integer NOT NULL CHECK (chunk_index >= 0),
  cells jsonb NOT NULL CHECK (cells->>'projectId' = project_id AND cells->>'version' = version
    AND (cells->>'chunkIndex')::integer = chunk_index),
  PRIMARY KEY (project_id,version,chunk_index)
);
CREATE TABLE enlighten_operational.mom_discussion_flags (
  project_id text NOT NULL,
  mom_task_id text NOT NULL,
  cells jsonb NOT NULL CHECK (cells->>'projectId' = project_id AND cells->>'momTaskId' = mom_task_id),
  PRIMARY KEY (project_id,mom_task_id)
);
ALTER TABLE enlighten_operational.product_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.product_assessment_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.mom_discussion_flags ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.product_assessments,enlighten_operational.product_assessment_chunks,
  enlighten_operational.mom_discussion_flags FROM PUBLIC;
