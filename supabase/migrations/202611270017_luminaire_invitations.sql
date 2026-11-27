CREATE TABLE enlighten_operational.luminaire_invitations (
  token_hash text PRIMARY KEY, project_id text NOT NULL, expires timestamptz NOT NULL, items jsonb NOT NULL
);
CREATE TABLE enlighten_operational.luminaire_equivalent_offers (
  offer_id text PRIMARY KEY, project_id text NOT NULL, received_at timestamptz NOT NULL, offer jsonb NOT NULL
);
CREATE INDEX ON enlighten_operational.luminaire_equivalent_offers(project_id,received_at);
ALTER TABLE enlighten_operational.luminaire_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE enlighten_operational.luminaire_equivalent_offers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.luminaire_invitations,enlighten_operational.luminaire_equivalent_offers FROM PUBLIC;
