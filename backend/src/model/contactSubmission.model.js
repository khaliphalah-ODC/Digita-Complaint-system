export const ContactSubmissionTable = `
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'saved', 'failed')),
  delivery_error TEXT,
  delivered_to TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME
)
`;

export const insertContactSubmissionQuery = `
INSERT INTO contact_submissions (
  full_name,
  email,
  organization,
  subject,
  message,
  delivery_status,
  delivery_error,
  delivered_to
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

export const updateContactSubmissionDeliveryQuery = `
UPDATE contact_submissions
SET
  delivery_status = ?,
  delivery_error = ?,
  delivered_to = ?,
  delivered_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE delivered_at END
WHERE id = ?
`;
