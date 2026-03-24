// platformSettings.model: defines SQLite schema and queries for platform settings.
export const PlatformSettings = `CREATE TABLE IF NOT EXISTS platform_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    system_name TEXT NOT NULL DEFAULT 'Complaint Management System',
    maintenance_mode INTEGER NOT NULL DEFAULT 0 CHECK (maintenance_mode IN (0, 1)),
    default_org_status TEXT NOT NULL DEFAULT 'active' CHECK (default_org_status IN ('active', 'inactive')),
    password_min_length INTEGER NOT NULL DEFAULT 8,
    session_ttl_minutes INTEGER NOT NULL DEFAULT 1440,
    require_email_verification INTEGER NOT NULL DEFAULT 1 CHECK (require_email_verification IN (0, 1)),
    enforce_status_sequence INTEGER NOT NULL DEFAULT 0 CHECK (enforce_status_sequence IN (0, 1)),
    require_admin_response_on_resolve INTEGER NOT NULL DEFAULT 0 CHECK (require_admin_response_on_resolve IN (0, 1)),
    escalation_threshold_hours INTEGER NOT NULL DEFAULT 72,
    enforce_escalation_threshold INTEGER NOT NULL DEFAULT 0 CHECK (enforce_escalation_threshold IN (0, 1)),
    response_sla_hours INTEGER NOT NULL DEFAULT 48,
    notifications_enabled INTEGER NOT NULL DEFAULT 1 CHECK (notifications_enabled IN (0, 1)),
    notify_on_complaint_created INTEGER NOT NULL DEFAULT 1 CHECK (notify_on_complaint_created IN (0, 1)),
    notify_on_status_change INTEGER NOT NULL DEFAULT 1 CHECK (notify_on_status_change IN (0, 1)),
    notify_on_response INTEGER NOT NULL DEFAULT 1 CHECK (notify_on_response IN (0, 1)),
    notify_on_escalation INTEGER NOT NULL DEFAULT 1 CHECK (notify_on_escalation IN (0, 1)),
    notify_on_chat_message INTEGER NOT NULL DEFAULT 1 CHECK (notify_on_chat_message IN (0, 1)),
    notify_on_assignment INTEGER NOT NULL DEFAULT 1 CHECK (notify_on_assignment IN (0, 1)),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

export const selectPlatformSettings = `
SELECT
  id,
  system_name,
  maintenance_mode,
  default_org_status,
  password_min_length,
  session_ttl_minutes,
  require_email_verification,
  enforce_status_sequence,
  require_admin_response_on_resolve,
  escalation_threshold_hours,
  enforce_escalation_threshold,
  response_sla_hours,
  notifications_enabled,
  notify_on_complaint_created,
  notify_on_status_change,
  notify_on_response,
  notify_on_escalation,
  notify_on_chat_message,
  notify_on_assignment,
  updated_at
FROM platform_settings
WHERE id = 1
`;

export const insertDefaultPlatformSettings = `
INSERT INTO platform_settings (
  id,
  system_name,
  maintenance_mode,
  default_org_status,
  password_min_length,
  session_ttl_minutes,
  require_email_verification,
  enforce_status_sequence,
  require_admin_response_on_resolve,
  escalation_threshold_hours,
  enforce_escalation_threshold,
  response_sla_hours,
  notifications_enabled,
  notify_on_complaint_created,
  notify_on_status_change,
  notify_on_response,
  notify_on_escalation,
  notify_on_chat_message,
  notify_on_assignment
)
VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const updatePlatformSettings = `
UPDATE platform_settings
SET
  system_name = ?,
  maintenance_mode = ?,
  default_org_status = ?,
  password_min_length = ?,
  session_ttl_minutes = ?,
  require_email_verification = ?,
  enforce_status_sequence = ?,
  require_admin_response_on_resolve = ?,
  escalation_threshold_hours = ?,
  enforce_escalation_threshold = ?,
  response_sla_hours = ?,
  notifications_enabled = ?,
  notify_on_complaint_created = ?,
  notify_on_status_change = ?,
  notify_on_response = ?,
  notify_on_escalation = ?,
  notify_on_chat_message = ?,
  notify_on_assignment = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 1
`;
