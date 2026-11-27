BEGIN;
CREATE SCHEMA IF NOT EXISTS enlighten_operational;
REVOKE ALL ON SCHEMA enlighten_operational FROM PUBLIC, anon, authenticated;

DO $body$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'readme',
    'home_agenda_sessions',
    'studio_briefings',
    'assistant_profiles',
    'studio_attendance_corrections',
    'line_of_work_comments',
    'internal_work_areas',
    'assigned_work_acceptance',
    'assigned_work_comments',
    'studio_attendance',
    'active_time',
    'app_feedback',
    'feedback_attachments',
    'diary_entries',
    'studio_journal',
    'site_execution_items',
    'wih_plans',
    'application_images',
    'studio_threads',
    'studio_thread_comments',
    'project_books',
    'project_closeout',
    'workflow_delegations',
    'email_drawing_intakes',
    'email_intake_messages',
    'project_onboarding',
    'technical_workbooks',
    'technical_tables',
    'technical_table_chunks',
    'technical_fittings',
    'duplicate_drawing_cleanup',
    'drawing_portal_access',
    'issued_drawings',
    'mom_tasks',
    'execution_visits',
    'project_meetings',
    'site_punch_ins',
    'project_roles',
    'drawing_task_master',
    'designations',
    'departments',
    'projects',
    'project_contacts',
    'line_of_work',
    'floor_zones',
    'people',
    'contacts',
    'drawing_register',
    'design_dashboard',
    'design_tasks',
    'wih',
    'work_log',
    'execution',
    'meetings',
    'mom',
    'site_visits',
    'files',
    'activity_log',
    'lookups',
    'accounts_journal'
  ] LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS enlighten_operational.%I (
      record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      source_export_id text,
      source_row_number integer,
      cells jsonb NOT NULL CHECK (jsonb_typeof(cells) = ''object''),
      updated_at timestamptz NOT NULL DEFAULT now()
    )',table_name);
    EXECUTE format('ALTER TABLE enlighten_operational.%I ENABLE ROW LEVEL SECURITY',table_name);
    EXECUTE format('REVOKE ALL ON TABLE enlighten_operational.%I FROM PUBLIC, anon, authenticated',table_name);
  END LOOP;
END;
$body$;

CREATE INDEX IF NOT EXISTS eo_projects_business_id ON enlighten_operational.projects ((cells->>'projectId'));
CREATE INDEX IF NOT EXISTS eo_people_email ON enlighten_operational.people (lower(btrim(cells->>'email')));
CREATE INDEX IF NOT EXISTS eo_project_roles_user ON enlighten_operational.project_roles ((cells->>'userId'));
CREATE INDEX IF NOT EXISTS eo_design_tasks_project ON enlighten_operational.design_tasks ((cells->>'projectId'));
CREATE INDEX IF NOT EXISTS eo_design_tasks_business_id ON enlighten_operational.design_tasks ((cells->>'designTaskId'));
CREATE INDEX IF NOT EXISTS eo_wih_owner ON enlighten_operational.wih ((cells->>'assigneeUserId'),(cells->>'status'));
CREATE INDEX IF NOT EXISTS eo_wih_project ON enlighten_operational.wih ((cells->>'projectId'));
CREATE INDEX IF NOT EXISTS eo_drawings_project ON enlighten_operational.drawing_register ((cells->>'projectId'));
CREATE INDEX IF NOT EXISTS eo_files_project ON enlighten_operational.files ((cells->>'projectId'));
CREATE INDEX IF NOT EXISTS eo_accounts_record_id ON enlighten_operational.accounts_journal ((cells->>'Record ID'));

CREATE TABLE IF NOT EXISTS enlighten_operational.payroll_machine_attendance (
  employee_id text NOT NULL,
  attendance_date date NOT NULL,
  check_in time(0),
  check_out time(0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (employee_id, attendance_date)
);
ALTER TABLE enlighten_operational.payroll_machine_attendance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON enlighten_operational.payroll_machine_attendance FROM PUBLIC, anon, authenticated;
COMMIT;
