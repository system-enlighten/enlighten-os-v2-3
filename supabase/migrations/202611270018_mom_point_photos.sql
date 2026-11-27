CREATE TABLE enlighten_operational.mom_point_photos (
  photo_key text PRIMARY KEY,
  project_id text NOT NULL,
  visit_plan_id text NOT NULL,
  visit_id text NOT NULL,
  point_id text NOT NULL,
  content_hash text NOT NULL,
  photo jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL
);
CREATE INDEX ON enlighten_operational.mom_point_photos(project_id,visit_plan_id,visit_id,point_id);
ALTER TABLE enlighten_operational.mom_point_photos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.mom_point_photos FROM PUBLIC;
