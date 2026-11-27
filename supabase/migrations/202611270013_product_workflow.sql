CREATE TABLE enlighten_operational.product_workflow_drafts (
  id text PRIMARY KEY, project_id text NOT NULL, brand text NOT NULL, data jsonb NOT NULL
);
CREATE TABLE enlighten_operational.product_partner_history (
  id text PRIMARY KEY, project_id text NOT NULL, brand text NOT NULL, data jsonb NOT NULL
);
CREATE INDEX ON enlighten_operational.product_workflow_drafts(project_id,brand);
CREATE INDEX ON enlighten_operational.product_partner_history(brand,project_id);
ALTER TABLE enlighten_operational.product_workflow_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.product_partner_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.product_workflow_drafts,enlighten_operational.product_partner_history FROM PUBLIC;
