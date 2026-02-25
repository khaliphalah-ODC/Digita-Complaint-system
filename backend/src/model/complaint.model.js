export const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
export const VALID_STATUSES = ['submitted', 'in_review', 'resolved', 'closed'];
export const VALID_TARGET_TYPES = ['government', 'business', 'community_panel', 'individual', 'others'];
export const VALID_CHANNELS = ['web', 'email', 'sms', 'qr'];

export const complaintsQuery = `
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  anonymous_label TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  target_type TEXT NOT NULL DEFAULT 'others' CHECK(target_type IN ('government', 'business', 'community_panel', 'individual', 'others')),
  target_name TEXT,
  target_contact TEXT,
  source_channel TEXT NOT NULL DEFAULT 'web' CHECK(source_channel IN ('web', 'email', 'sms', 'qr')),
  classification TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted', 'in_review', 'resolved', 'closed')),
  tracking_code TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;
 
export const createComplaintQuery = `
INSERT INTO complaints (
  user_id, is_anonymous, anonymous_label, title, description, category, target_type, target_name, target_contact, source_channel, classification, priority, tracking_code
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

export const fetchComplaintsQuery = `SELECT * FROM complaints ORDER BY id DESC;`;

export const fetchComplaintByIdQuery = `SELECT * FROM complaints WHERE id = ?;`;

export const fetchComplaintByTrackingCodeQuery = `SELECT * FROM complaints WHERE tracking_code = ?;`;

export const fetchComplaintsByTargetTypeQuery = `
SELECT * FROM complaints WHERE target_type = ? ORDER BY id DESC;
`;

export const fetchComplaintStatusCountsByTargetTypeQuery = `
SELECT status, COUNT(*) AS total
FROM complaints
WHERE target_type = ?
GROUP BY status;
`;

export const fetchComplaintTargetDistributionQuery = `
SELECT target_type, COUNT(*) AS total
FROM complaints
GROUP BY target_type;
`;

export const fetchComplaintGlobalStatusCountsQuery = `
SELECT status, COUNT(*) AS total
FROM complaints
GROUP BY status;
`;

export const updateComplaintQuery = `
UPDATE complaints
SET
  title = ?,
  description = ?,
  category = ?,
  is_anonymous = ?,
  anonymous_label = ?,
  target_type = ?,
  target_name = ?,
  target_contact = ?,
  source_channel = ?,
  classification = ?,
  priority = ?,
  status = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const updateComplaintStatusQuery = `
UPDATE complaints
SET status = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
`;

export const deleteComplaintQuery = `DELETE FROM complaints WHERE id = ?;`;
