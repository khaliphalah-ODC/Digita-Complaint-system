// feedback.model model: defines SQLite schema and SQL queries for this module.
export const Feedback = `
 Create table if not exists feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER,
  user_id INTEGER,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (complaint_id) REFERENCES complaint(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`

export const createFeedbackQuery = `INSERT INTO feedback (complaint_id, user_id, rating, comment) VALUES (?, ?, ?, ?);`;
export const fetchAllFeedbackQuery = `
SELECT
  f.*,
  c.title AS complaint_title,
  c.tracking_code AS complaint_tracking_code,
  c.organization_id AS complaint_organization_id,
  u.full_name AS user_full_name,
  u.email AS user_email
FROM feedback f
LEFT JOIN complaint c ON c.id = f.complaint_id
LEFT JOIN users u ON u.id = f.user_id
ORDER BY f.id DESC;
`;
export const fetchFeedbackByIdQuery = `
SELECT
  f.*,
  c.title AS complaint_title,
  c.tracking_code AS complaint_tracking_code,
  c.organization_id AS complaint_organization_id,
  u.full_name AS user_full_name,
  u.email AS user_email
FROM feedback f
LEFT JOIN complaint c ON c.id = f.complaint_id
LEFT JOIN users u ON u.id = f.user_id
WHERE f.id = ?;
`;
export const fetchFeedbackByComplaintIdQuery = `
SELECT
  f.*,
  c.title AS complaint_title,
  c.tracking_code AS complaint_tracking_code,
  c.organization_id AS complaint_organization_id,
  u.full_name AS user_full_name,
  u.email AS user_email
FROM feedback f
LEFT JOIN complaint c ON c.id = f.complaint_id
LEFT JOIN users u ON u.id = f.user_id
WHERE f.complaint_id = ?
ORDER BY f.created_at DESC;
`;
export const fetchFeedbackByUserIdQuery = `
SELECT
  f.*,
  c.title AS complaint_title,
  c.tracking_code AS complaint_tracking_code,
  c.organization_id AS complaint_organization_id,
  u.full_name AS user_full_name,
  u.email AS user_email
FROM feedback f
LEFT JOIN complaint c ON c.id = f.complaint_id
LEFT JOIN users u ON u.id = f.user_id
WHERE f.user_id = ?
ORDER BY f.id DESC;
`;
export const fetchFeedbackByOrganizationIdQuery = `
SELECT
  f.*,
  c.title AS complaint_title,
  c.tracking_code AS complaint_tracking_code,
  c.organization_id AS complaint_organization_id,
  u.full_name AS user_full_name,
  u.email AS user_email
FROM feedback f
LEFT JOIN complaint c ON c.id = f.complaint_id
LEFT JOIN users u ON u.id = f.user_id
WHERE c.organization_id = ?
ORDER BY f.id DESC;
`;
export const updateFeedbackQuery = `
UPDATE feedback
SET rating = ?, comment = ?
WHERE id = ?;
`;
export const deleteFeedbackByComplaintIdQuery = `DELETE FROM feedback WHERE complaint_id = ?;`;
export const deleteFeedbackByIdQuery = `DELETE FROM feedback WHERE id = ?;`;
