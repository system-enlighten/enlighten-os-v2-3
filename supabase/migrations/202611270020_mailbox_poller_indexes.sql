-- Keep historical duplicates intact. The worker uses an advisory lock when staging Gmail IDs.
CREATE INDEX IF NOT EXISTS email_intake_message_id_idx
  ON enlighten_operational.email_intake_messages ((cells->>'messageId'));
CREATE INDEX IF NOT EXISTS email_intake_source_message_idx
  ON enlighten_operational.email_drawing_intakes ((cells->>'sourceMessageId'));
CREATE INDEX IF NOT EXISTS email_intake_approval_token_idx
  ON enlighten_operational.email_drawing_intakes (lower(cells->>'token'));
