CREATE TABLE enlighten_operational.marketing_records (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('Case study','Relationship','Enquiry')),
  details jsonb NOT NULL,
  version uuid NOT NULL
);
ALTER TABLE enlighten_operational.marketing_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.marketing_records FROM PUBLIC;
