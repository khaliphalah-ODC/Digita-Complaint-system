export const FeedbackFormsTable = `
CREATE TABLE IF NOT EXISTS feedback_forms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  is_public INTEGER NOT NULL DEFAULT 1 CHECK(is_public IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  allow_anonymous INTEGER NOT NULL DEFAULT 1 CHECK(allow_anonymous IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE
);
`;

export const FeedbackFormFieldsTable = `
CREATE TABLE IF NOT EXISTS feedback_form_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  form_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL,
  placeholder TEXT,
  help_text TEXT,
  is_required INTEGER NOT NULL DEFAULT 0 CHECK(is_required IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
  options_json TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES feedback_forms(id) ON DELETE CASCADE,
  UNIQUE(form_id, field_key)
);
`;

export const FeedbackSubmissionsTable = `
CREATE TABLE IF NOT EXISTS feedback_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  form_id INTEGER NOT NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 1 CHECK(is_anonymous IN (0, 1)),
  submitted_by_user_id INTEGER,
  respondent_name TEXT,
  respondent_email TEXT,
  respondent_phone TEXT,
  response_json TEXT NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  message_summary TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organization(organization_id) ON DELETE CASCADE,
  FOREIGN KEY (form_id) REFERENCES feedback_forms(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);
`;

export const selectFeedbackFormByOrganizationId = `
SELECT *
FROM feedback_forms
WHERE organization_id = ?
LIMIT 1
`;

export const selectFeedbackFormBySlug = `
SELECT *
FROM feedback_forms
WHERE slug = ?
LIMIT 1
`;

export const insertFeedbackFormQuery = `
INSERT INTO feedback_forms (
  organization_id,
  slug,
  title,
  description,
  is_public,
  is_active,
  allow_anonymous,
  version
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

export const updateFeedbackFormByOrganizationId = `
UPDATE feedback_forms
SET
  slug = ?,
  title = ?,
  description = ?,
  is_public = ?,
  is_active = ?,
  allow_anonymous = ?,
  version = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE organization_id = ?
`;

export const selectFeedbackFieldsByFormId = `
SELECT *
FROM feedback_form_fields
WHERE form_id = ?
ORDER BY sort_order ASC, id ASC
`;

export const selectFeedbackFieldById = `
SELECT *
FROM feedback_form_fields
WHERE id = ?
LIMIT 1
`;

export const insertFeedbackFieldQuery = `
INSERT INTO feedback_form_fields (
  form_id,
  label,
  field_key,
  field_type,
  placeholder,
  help_text,
  is_required,
  is_active,
  options_json,
  sort_order
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const updateFeedbackFieldById = `
UPDATE feedback_form_fields
SET
  label = ?,
  field_key = ?,
  field_type = ?,
  placeholder = ?,
  help_text = ?,
  is_required = ?,
  is_active = ?,
  options_json = ?,
  sort_order = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
`;

export const deleteFeedbackFieldById = `
DELETE FROM feedback_form_fields
WHERE id = ?
`;

export const updateFeedbackFieldSortOrderById = `
UPDATE feedback_form_fields
SET
  sort_order = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ? AND form_id = ?
`;

export const insertFeedbackSubmissionQuery = `
INSERT INTO feedback_submissions (
  organization_id,
  form_id,
  is_anonymous,
  submitted_by_user_id,
  respondent_name,
  respondent_email,
  respondent_phone,
  response_json,
  rating,
  message_summary
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const selectFeedbackSubmissionsByOrganizationId = `
SELECT
  s.*,
  f.title AS form_title,
  o.name AS organization_name
FROM feedback_submissions s
INNER JOIN feedback_forms f ON f.id = s.form_id
INNER JOIN organization o ON o.organization_id = s.organization_id
WHERE s.organization_id = ?
ORDER BY s.created_at DESC, s.id DESC
`;

export const selectFeedbackSubmissionById = `
SELECT
  s.*,
  f.title AS form_title,
  o.name AS organization_name
FROM feedback_submissions s
INNER JOIN feedback_forms f ON f.id = s.form_id
INNER JOIN organization o ON o.organization_id = s.organization_id
WHERE s.id = ?
LIMIT 1
`;
