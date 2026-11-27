BEGIN;

CREATE TABLE IF NOT EXISTS enlighten_operational.linear_application_layout (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  version integer NOT NULL CHECK (version > 0),
  layout jsonb NOT NULL CHECK (jsonb_typeof(layout) = 'object'),
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enlighten_operational.linear_product_links (
  application_id text NOT NULL,
  reference_key text NOT NULL,
  fitting_id text NOT NULL,
  product_id text NOT NULL,
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (application_id, reference_key)
);

CREATE TABLE IF NOT EXISTS enlighten_operational.linear_application_captions (
  application_id text PRIMARY KEY,
  caption text NOT NULL DEFAULT '',
  code text NOT NULL DEFAULT '',
  updated_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enlighten_operational.linear_application_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.linear_product_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.linear_application_captions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.linear_application_layout, enlighten_operational.linear_product_links,
  enlighten_operational.linear_application_captions FROM PUBLIC;

COMMIT;
