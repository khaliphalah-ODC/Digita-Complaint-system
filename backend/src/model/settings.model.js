export const OrganizationSettingsTable = `
CREATE TABLE IF NOT EXISTS organization_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL UNIQUE,
  description TEXT,
  anonymous_complaints_enabled INTEGER NOT NULL DEFAULT 1 CHECK(anonymous_complaints_enabled IN (0, 1)),
  default_department_id INTEGER,
  auto_route_to_department INTEGER NOT NULL DEFAULT 0 CHECK(auto_route_to_department IN (0, 1)),
  escalation_threshold_hours INTEGER NOT NULL DEFAULT 72,
  response_sla_hours INTEGER NOT NULL DEFAULT 48,
  notify_on_new_complaints INTEGER NOT NULL DEFAULT 1 CHECK(notify_on_new_complaints IN (0, 1)),
  notify_on_public_feedback INTEGER NOT NULL DEFAULT 1 CHECK(notify_on_public_feedback IN (0, 1)),
  notify_on_escalations INTEGER NOT NULL DEFAULT 1 CHECK(notify_on_escalations IN (0, 1)),
  allow_org_admin_user_management INTEGER NOT NULL DEFAULT 1 CHECK(allow_org_admin_user_management IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE
);
`;

export const UserSettingsTable = `
CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  phone TEXT,
  profile_image TEXT,
  notify_email_updates INTEGER NOT NULL DEFAULT 1 CHECK(notify_email_updates IN (0, 1)),
  notify_status_updates INTEGER NOT NULL DEFAULT 1 CHECK(notify_status_updates IN (0, 1)),
  notify_public_feedback INTEGER NOT NULL DEFAULT 0 CHECK(notify_public_feedback IN (0, 1)),
  anonymity_preference INTEGER NOT NULL DEFAULT 0 CHECK(anonymity_preference IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

export const selectOrganizationSettingsByOrganizationId = `
SELECT *
FROM organization_settings
WHERE organization_id = ?
LIMIT 1
`;

export const insertOrganizationSettingsQuery = `
INSERT INTO organization_settings (
  organization_id,
  description,
  anonymous_complaints_enabled,
  default_department_id,
  auto_route_to_department,
  escalation_threshold_hours,
  response_sla_hours,
  notify_on_new_complaints,
  notify_on_public_feedback,
  notify_on_escalations,
  allow_org_admin_user_management
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const updateOrganizationSettingsQuery = `
UPDATE organization_settings
SET
  description = ?,
  anonymous_complaints_enabled = ?,
  default_department_id = ?,
  auto_route_to_department = ?,
  escalation_threshold_hours = ?,
  response_sla_hours = ?,
  notify_on_new_complaints = ?,
  notify_on_public_feedback = ?,
  notify_on_escalations = ?,
  allow_org_admin_user_management = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE organization_id = ?
`;

export const selectUserSettingsByUserId = `
SELECT *
FROM user_settings
WHERE user_id = ?
LIMIT 1
`;

export const insertUserSettingsQuery = `
INSERT INTO user_settings (
  user_id,
  phone,
  profile_image,
  notify_email_updates,
  notify_status_updates,
  notify_public_feedback,
  anonymity_preference
) VALUES (?, ?, ?, ?, ?, ?, ?)
`;

export const updateUserSettingsQuery = `
UPDATE user_settings
SET
  phone = ?,
  profile_image = ?,
  notify_email_updates = ?,
  notify_status_updates = ?,
  notify_public_feedback = ?,
  anonymity_preference = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?
`;

export const updateOwnProfileQuery = `
UPDATE users
SET
  full_name = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
`;
